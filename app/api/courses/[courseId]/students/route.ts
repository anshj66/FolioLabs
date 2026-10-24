import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"
import { isApprovedAcademic, normalizeAcademicRole } from "@/lib/platform/permissions"

export const runtime = "nodejs"
export async function GET(_request: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Please sign in to view enrolled students." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Admin accounts do not access academic course rosters." }, { status: 403 })
  const { data: profile } = await supabase.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile) || normalizeAcademicRole(profile?.academic_role) !== "professor") return NextResponse.json({ error: "Only approved professors can view course rosters." }, { status: 403 })
  const { courseId } = await context.params
  const service = createServiceClient()
  const { data: course } = await service.from("courses").select("id,professor_id,title").eq("id", courseId).maybeSingle()
  if (!course || course.professor_id !== user.id) return NextResponse.json({ error: "Course not found or you do not teach this course." }, { status: 404 })
  const { data: memberships, error: membershipError } = await service.from("course_memberships").select("user_id,joined_at,status,batch_label").eq("course_id", courseId).eq("status", "enrolled").order("joined_at", { ascending: true })
  if (membershipError) return NextResponse.json({ error: "Could not load the course roster." }, { status: 500 })
  const ids = [...new Set((memberships ?? []).map(item => item.user_id))]
  const { data: profiles } = ids.length ? await service.from("profiles").select("id,full_name,academic_role,academic_year,verification_status").in("id", ids) : { data: [] as any[] }
  const profileMap = new Map((profiles ?? []).map(item => [item.id, item]))
  const students = (memberships ?? []).map(item => {
    const student = profileMap.get(item.user_id)
    return { id: item.user_id, full_name: student?.full_name || "FolioLabs member", academic_role: student?.academic_role || "student", academic_year: student?.academic_year ?? null, verification_status: student?.verification_status || "pending_upload", batch_label: item.batch_label || "General", joined_at: item.joined_at }
  })
  return NextResponse.json({ course: { id: course.id, title: course.title }, students, count: students.length })
}


export async function PATCH(request: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Admin accounts cannot manage course batches." }, { status: 403 })
  const { data: profile } = await supabase.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile) || normalizeAcademicRole(profile?.academic_role) !== "professor") return NextResponse.json({ error: "Only verified professors can assign batches." }, { status: 403 })
  const { courseId } = await context.params
  let body: any; try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }) }
  const studentId = typeof body.student_id === "string" ? body.student_id : ""
  const batchLabel = typeof body.batch_label === "string" ? body.batch_label.trim().slice(0, 100) : ""
  if (!studentId || !batchLabel) return NextResponse.json({ error: "Student and batch name are required." }, { status: 400 })
  const service = createServiceClient()
  const { data: course } = await service.from("courses").select("id,professor_id").eq("id", courseId).maybeSingle()
  if (!course || course.professor_id !== user.id) return NextResponse.json({ error: "Course not found or not owned by you." }, { status: 403 })
  const { data: membership, error: updateError } = await service.from("course_memberships").update({ batch_label: batchLabel }).eq("course_id", courseId).eq("user_id", studentId).eq("status", "enrolled").select("user_id,batch_label").maybeSingle()
  if (updateError || !membership) return NextResponse.json({ error: "Could not assign this student to the batch." }, { status: 500 })
  return NextResponse.json({ membership })
}
