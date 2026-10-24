import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"
import { isApprovedAcademic, normalizeAcademicRole } from "@/lib/platform/permissions"

export const dynamic = "force-dynamic"
export async function GET() {
  const session = await createClient(); const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ projects: [], admin: true })
  const { data: profile } = await session.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile) || normalizeAcademicRole(profile?.academic_role) === "professor") return NextResponse.json({ error: "Defense is available to approved student researchers." }, { status: 403 })
  const service = createServiceClient()
  const [{ data: projects, error }, { data: sessions }] = await Promise.all([
    service.from("researchfolio_projects").select("id,title,topic,current_stage,project_data,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }),
    service.from("researchfolio_defense_sessions").select("id,project_id,answers,status,created_at,updated_at,submitted_at").eq("user_id", user.id),
  ])
  if (error) return NextResponse.json({ error: "Could not load your ResearchFolio projects." }, { status: 500 })
  const byProject = new Map((sessions ?? []).map(s => [s.project_id, s]))
  return NextResponse.json({ projects: (projects ?? []).map(p => ({ ...p, defense: byProject.get(p.id) ?? null })) })
}
export async function POST(request: NextRequest) {
  const session = await createClient(); const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Admin accounts cannot submit student defenses." }, { status: 403 })
  const { data: profile } = await session.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile) || normalizeAcademicRole(profile?.academic_role) === "professor") return NextResponse.json({ error: "Defense is available to approved student researchers." }, { status: 403 })
  let body: any; try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }) }
  const projectId = typeof body.project_id === "string" ? body.project_id : ""
  const answers = body.answers && typeof body.answers === "object" ? body.answers : {}
  const submit = body.action === "submit"
  const service = createServiceClient()
  const { data: project } = await service.from("researchfolio_projects").select("id,user_id").eq("id", projectId).eq("user_id", user.id).maybeSingle()
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 })
  const { data: existing } = await service.from("researchfolio_defense_sessions").select("id,status").eq("project_id", projectId).eq("user_id", user.id).maybeSingle()
  if (existing?.status === "submitted") return NextResponse.json({ error: "This defense has already been submitted and is read-only." }, { status: 409 })
  const { data: record, error } = await service.from("researchfolio_defense_sessions").upsert({ project_id: projectId, user_id: user.id, answers, status: submit ? "submitted" : "in_progress", updated_at: new Date().toISOString(), submitted_at: submit ? new Date().toISOString() : null }, { onConflict: "project_id,user_id" }).select("id,project_id,answers,status,updated_at,submitted_at").single()
  if (error || !record) return NextResponse.json({ error: "Could not save your defense response. Apply the Phase 3 migration." }, { status: 500 })
  return NextResponse.json({ defense: record })
}
