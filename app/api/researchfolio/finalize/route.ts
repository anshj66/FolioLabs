import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"
import { isApprovedAcademic } from "@/lib/platform/permissions"

export const runtime = "nodejs"
const MILESTONES = [20, 40, 60, 80, 100] as const

export async function POST(request: NextRequest) {
  const session = await createClient()
  const { data: { user }, error: authError } = await session.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Please sign in before finalizing a section." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Administrator accounts do not finalize student research sections." }, { status: 403 })
  const { data: profile } = await session.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile)) return NextResponse.json({ error: "Your academic role must be approved before finalizing sections." }, { status: 403 })
  let body: { project_id?: unknown; section_key?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }) }
  const projectId = typeof body.project_id === "string" ? body.project_id : ""
  const sectionKey = typeof body.section_key === "string" ? body.section_key : ""
  if (!projectId || !sectionKey || sectionKey.length > 120) return NextResponse.json({ error: "Project ID and section key are required." }, { status: 400 })

  try {
    const service = createServiceClient()
    const { data: project, error: projectError } = await service.from("researchfolio_projects").select("id,user_id,title,project_data,updated_at").eq("id", projectId).eq("user_id", user.id).maybeSingle()
    if (projectError) throw projectError
    if (!project) return NextResponse.json({ error: "Project not found or you do not own it." }, { status: 404 })
    const data = project.project_data && typeof project.project_data === "object" && !Array.isArray(project.project_data) ? project.project_data as Record<string, any> : {}
    const sections = Array.isArray(data.sections) ? data.sections : []
    const section = sections.find((item: any) => item && item.key === sectionKey)
    if (!section || typeof section.content !== "string" || !section.content.trim()) return NextResponse.json({ error: "Add and save content to this section before finalizing it." }, { status: 400 })
    const sectionLogs = data.sectionLogs && typeof data.sectionLogs === "object" && !Array.isArray(data.sectionLogs) ? { ...data.sectionLogs } : {}
    const existing = sectionLogs[sectionKey] && typeof sectionLogs[sectionKey] === "object" ? sectionLogs[sectionKey] : { notes: "" }
    if (existing.finalizedAt) {
      const { data: feedbackRows, error: feedbackError } = await service.from("researchfolio_feedback").select("id").eq("project_id", projectId).eq("author_id", user.id).eq("section_key", sectionKey).gt("created_at", String(existing.finalizedAt)).limit(1)
      if (feedbackError) throw feedbackError
      if (!feedbackRows?.length) return NextResponse.json({ error: "This section is already finalized. Wait for eligible feedback on this section before revising or re-finalizing it." }, { status: 409 })
    }
    const finalizedAt = new Date().toISOString()
    sectionLogs[sectionKey] = { ...existing, finalizedAt, finalizedContent: section.content }
    const nextData = { ...data, sectionLogs }
    const { data: updated, error: updateError } = await service.from("researchfolio_projects").update({ project_data: nextData, updated_at: finalizedAt }).eq("id", projectId).eq("user_id", user.id).select("id,user_id,title,project_type,topic,course_title,current_stage,project_data,brief,visibility,community_review_status,updated_at,created_at").single()
    if (updateError) throw updateError

    const finalizedCount = sections.filter((item: any) => item && typeof item.content === "string" && item.content.trim() && sectionLogs[item.key]?.finalizedAt).length
    const progress = sections.length ? Math.round((finalizedCount / sections.length) * 100) : 0
    const amount = Number.parseInt(process.env.MERIT_CREDITS_MILESTONE_AMOUNT || "10", 10)
    const rewardAmount = Number.isFinite(amount) && amount > 0 && amount <= 1000 ? amount : 10
    const earned: number[] = []
    for (const milestone of MILESTONES.filter(value => progress >= value)) {
      const { data: inserted, error: ledgerError } = await service.from("merit_credit_ledger").upsert({ user_id: user.id, amount: rewardAmount, event_type: "project_milestone", source_type: "researchfolio_project", source_id: projectId, idempotency_key: `project:${projectId}:milestone:${milestone}`, description: `${milestone}% ResearchFolio progress milestone finalized`, created_by: user.id }, { onConflict: "idempotency_key", ignoreDuplicates: true }).select("id")
      if (ledgerError) {
        console.error("Merit Credits milestone award failed:", ledgerError)
        // Finalization remains saved; a later retry can safely award using the same idempotency key.
        continue
      }
      if (inserted?.length) earned.push(milestone)
    }
    return NextResponse.json({ project: updated, progress, earned_milestones: earned, credit_amount: rewardAmount })
  } catch (error) {
    console.error("ResearchFolio finalization failed:", error)
    return NextResponse.json({ error: "Could not finalize this section. Your saved draft remains available; please retry." }, { status: 500 })
  }
}
