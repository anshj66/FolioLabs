import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"

export const runtime = "nodejs"

/** Anonymous feedback inbox/outbox. Identity columns are deliberately never returned. */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Please sign in to view feedback." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ received: [], given: [], admin: true })
  const { data: profile } = await supabase.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  const professor = profile?.academic_role === "professor"

  const service = createServiceClient()
  const [{ data: received, error: receivedError }, { data: given, error: givenError }] = await Promise.all([
    service.from("researchfolio_feedback").select("id,project_id,section_key,feedback,status,created_at,updated_at,reviewer_role_snapshot,reviewer_year_snapshot").eq("author_id", user.id).order("created_at", { ascending: false }).limit(200),
    professor ? Promise.resolve({ data: [], error: null } as any) : service.from("researchfolio_feedback").select("id,project_id,section_key,feedback,status,created_at,updated_at").eq("reviewer_id", user.id).order("created_at", { ascending: false }).limit(200),
  ])
  if (receivedError || givenError) {
    console.error("Feedback inbox query failed", receivedError || givenError)
    return NextResponse.json({ error: "Could not load feedback. Ensure the platform migration is applied." }, { status: 500 })
  }
  const projectIds = [...new Set([...(received ?? []), ...(given ?? [])].map(item => item.project_id))]
  const { data: projects } = projectIds.length ? await service.from("researchfolio_projects").select("id,title").in("id", projectIds) : { data: [] as { id: string; title: string }[] }
  const titles = new Map((projects ?? []).map(project => [project.id, project.title || "Untitled project"]))
  return NextResponse.json({
    professor,
    received: (received ?? []).map(item => ({ reviewer_role_snapshot: item.reviewer_role_snapshot, id: item.id, project_id: item.project_id, project_title: titles.get(item.project_id) || "Research project", section_key: item.section_key, feedback: item.feedback, status: item.status, created_at: item.created_at, updated_at: item.updated_at, reviewer_label: "Anonymous reviewer" })),
    given: (given ?? []).map(item => ({ id: item.id, project_id: item.project_id, project_title: titles.get(item.project_id) || "Research project", section_key: item.section_key, feedback: item.feedback, status: item.status, created_at: item.created_at, updated_at: item.updated_at, recipient_label: "Anonymous researcher" })),
  })
}
