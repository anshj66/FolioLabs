import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"
import { canReviewAuthor, isApprovedAcademic } from "@/lib/platform/permissions"

export const runtime = "nodejs"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Please sign in to view community review." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ projects: [], admin: true })
  const { data: reviewer } = await supabase.from("profiles").select("academic_role,academic_year,verification_status,full_name").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(reviewer)) return NextResponse.json({ error: "Your academic role must be approved before community review." }, { status: 403 })
  if (reviewer?.academic_role === "professor") return NextResponse.json({ projects: [], professor: true, message: "Professor accounts use Research Insights, not student community review." })
  const service = createServiceClient()
  const { data: projects, error: projectError } = await service.from("researchfolio_projects").select("id,user_id,title,brief,topic,project_type,project_data,current_stage,community_review_status,submitted_for_review_at,created_at,updated_at").eq("visibility", "community").eq("community_review_status", "published").order("submitted_for_review_at", { ascending: false }).limit(100)
  if (projectError) {
    console.error("Community review feed failed:", projectError)
    return NextResponse.json({ error: "Could not load community review. Apply the platform migration." }, { status: 500 })
  }
  const authorIds = [...new Set((projects ?? []).map(p => p.user_id))]
  const { data: profiles } = authorIds.length ? await service.from("profiles").select("id,full_name,academic_role,academic_year,verification_status").in("id", authorIds) : { data: [] as any[] }
  const profileMap = new Map<string, { id: string; full_name: string | null; academic_role: string | null; academic_year: number | null; verification_status: string | null }>((profiles ?? []).map((p: any) => [p.id, p]))
  const visible = (projects ?? []).filter(project => project.user_id !== user.id).map(project => {
    const author = profileMap.get(project.user_id)
    const data = project.project_data && typeof project.project_data === "object" ? project.project_data as { sections?: unknown } : {}
    const sections = Array.isArray(data.sections) ? data.sections.filter((section: any) => section && typeof section.title === "string" && typeof section.content === "string").map((section: any) => ({ key: String(section.key ?? "section"), title: section.title.slice(0, 180), content: section.content.slice(0, 12000) })) : []
    // Do not expose internal evidence logs, AI chat, or saved LaTeX files in the community feed.
    return { id: project.id, title: project.title, brief: project.brief, topic: project.topic, project_type: project.project_type, current_stage: project.current_stage, community_review_status: project.community_review_status, submitted_for_review_at: project.submitted_for_review_at, created_at: project.created_at, public_sections: sections, can_review: !!author && canReviewAuthor(author, reviewer) }
  })
  return NextResponse.json({ projects: visible })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Admin accounts do not participate in student community review." }, { status: 403 })
  const { data: profile } = await supabase.from("profiles").select("academic_role,academic_year,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile)) return NextResponse.json({ error: "Your academic role must be approved before using community review." }, { status: 403 })
  if (profile?.academic_role === "professor") return NextResponse.json({ error: "Professor accounts use Research Insights, not student community review." }, { status: 403 })
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }) }
  const action = body.action
  const projectId = typeof body.project_id === "string" ? body.project_id : ""
  if (!projectId) return NextResponse.json({ error: "Project ID is required." }, { status: 400 })

  if (action === "publish") {
    const brief = typeof body.brief === "string" ? body.brief.trim().slice(0, 1200) : ""
    if (brief.length < 20) return NextResponse.json({ error: "Write a project brief of at least 20 characters before requesting community review." }, { status: 400 })
    const { data: updated, error: updateError } = await supabase.from("researchfolio_projects").update({ brief, visibility: "community", community_review_status: "published", submitted_for_review_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", projectId).eq("user_id", user.id).select("id,title,brief,community_review_status,submitted_for_review_at").maybeSingle()
    if (updateError) {
      console.error("ResearchFolio publish failed:", updateError)
      return NextResponse.json({ error: "Could not submit this project for community review." }, { status: 500 })
    }
    if (!updated) return NextResponse.json({ error: "Project not found or you do not own it." }, { status: 404 })
    return NextResponse.json({ project: updated })
  }

  if (action === "feedback") {
    const feedback = typeof body.feedback === "string" ? body.feedback.trim() : ""
    const sectionKey = typeof body.section_key === "string" ? body.section_key.trim().slice(0, 120) || "__project__" : "__project__"
    const wordCount = feedback.split(/\s+/).filter(Boolean).length
    if (feedback.length < 30 || feedback.length > 10000 || wordCount < 6 || /^(.)\1{20,}$/.test(feedback)) return NextResponse.json({ error: "Feedback must be 30–10,000 characters and contain at least six meaningful words." }, { status: 400 })
    const service = createServiceClient()
    const [{ data: project }, { data: reviewer }] = await Promise.all([
      service.from("researchfolio_projects").select("id,user_id,visibility,community_review_status").eq("id", projectId).maybeSingle(),
      service.from("profiles").select("academic_role,academic_year,verification_status").eq("id", user.id).maybeSingle(),
    ])
    if (!project || project.visibility !== "community" || project.community_review_status !== "published") return NextResponse.json({ error: "This project is not open for community review." }, { status: 404 })
    if (project.user_id === user.id) return NextResponse.json({ error: "You cannot review your own project." }, { status: 403 })
    const { data: author } = await service.from("profiles").select("academic_role,academic_year,verification_status").eq("id", project.user_id).maybeSingle()
    if (!reviewer || !author || !canReviewAuthor(author, reviewer)) return NextResponse.json({ error: "Your approved academic role is not eligible to review this project." }, { status: 403 })
    const { data: saved, error: insertError } = await supabase.from("researchfolio_feedback").insert({ project_id: projectId, section_key: sectionKey, author_id: project.user_id, reviewer_id: user.id, reviewer_role_snapshot: reviewer.academic_role, reviewer_year_snapshot: reviewer.academic_year ?? null, feedback, status: "submitted" }).select("id,project_id,section_key,feedback,status,created_at").single()
    if (insertError) {
      if (insertError.code === "23505") return NextResponse.json({ error: "You have already submitted feedback for this project section." }, { status: 409 })
      console.error("ResearchFolio feedback insert failed:", insertError)
      return NextResponse.json({ error: "Could not submit feedback. Check that the platform migration is applied." }, { status: 500 })
    }
    const rawReward = Number.parseInt(process.env.MERIT_CREDITS_FEEDBACK_AMOUNT || "5", 10)
    const rewardAmount = Number.isFinite(rawReward) && rawReward > 0 && rawReward <= 1000 ? rawReward : 5
    const { error: rewardError } = await service.from("merit_credit_ledger").upsert({ user_id: user.id, amount: rewardAmount, event_type: "feedback", source_type: "researchfolio_feedback", source_id: saved.id, idempotency_key: `feedback:${saved.id}`, description: "Eligible research feedback contribution", created_by: user.id }, { onConflict: "idempotency_key", ignoreDuplicates: true })
    if (rewardError) console.error("Feedback Merit Credits award failed:", rewardError)
    return NextResponse.json({ feedback: saved, credit_awarded: !rewardError, credit_amount: rewardError ? 0 : rewardAmount, message: rewardError ? "Feedback submitted, but the Merit Credits award could not be recorded. An administrator should inspect the ledger." : `Feedback submitted. ${rewardAmount} Merit Credits awarded.` }, { status: 201 })
  }
  return NextResponse.json({ error: "Unsupported review action." }, { status: 400 })
}
