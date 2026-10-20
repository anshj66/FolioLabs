import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"
import { isApprovedAcademic, normalizeAcademicRole } from "@/lib/platform/permissions"

export const runtime = "nodejs"
type Context = { params: Promise<{ courseId: string }> }

export async function GET(_request: NextRequest, context: Context) {
  const { courseId } = await context.params
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
  const { data: profile } = await supabase.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (isAdminEmail(user.email) || !isApprovedAcademic(profile)) return NextResponse.json({ error: "An approved academic account is required." }, { status: 403 })
  const service = createServiceClient()
  const { data: course } = await service.from("courses").select("id,professor_id,status").eq("id", courseId).maybeSingle()
  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 })
  const isOwner = course.professor_id === user.id
  if (!isOwner) {
    const { data: membership } = await service.from("course_memberships").select("id").eq("course_id", courseId).eq("user_id", user.id).eq("status", "enrolled").maybeSingle()
    if (!membership) return NextResponse.json({ error: "Join this course before viewing its content." }, { status: 403 })
  }
  const { data, error: contentError } = await service.from("course_content").select("id,title,body,content_type,status,created_at,updated_at,author_id").eq("course_id", courseId).order("created_at", { ascending: false })
  if (contentError) return NextResponse.json({ error: "Could not load course content." }, { status: 500 })
  return NextResponse.json({ content: (data ?? []).filter(item => isOwner || item.status === "published") })
}

export async function POST(request: NextRequest, context: Context) {
  const { courseId } = await context.params
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
  const { data: profile } = await supabase.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (isAdminEmail(user.email) || !isApprovedAcademic(profile) || normalizeAcademicRole(profile?.academic_role) !== "professor") return NextResponse.json({ error: "Only approved professors can publish course content." }, { status: 403 })
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }) }
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const text = typeof body.body === "string" ? body.body.trim() : ""
  const type = ["lesson", "announcement", "assignment", "resource"].includes(String(body.content_type)) ? String(body.content_type) : "lesson"
  const status = body.status === "draft" ? "draft" : "published"
  if (!title || title.length > 180 || text.length > 50000) return NextResponse.json({ error: "Enter a title and keep content under 50,000 characters." }, { status: 400 })
  const service = createServiceClient()
  const { data: course } = await service.from("courses").select("id").eq("id", courseId).eq("professor_id", user.id).maybeSingle()
  if (!course) return NextResponse.json({ error: "Course not found or you are not its professor." }, { status: 404 })
  const { data: content, error: insertError } = await service.from("course_content").insert({ course_id: courseId, author_id: user.id, title, body: text, content_type: type, status }).select("id,title,body,content_type,status,created_at,updated_at").single()
  if (insertError) {
    console.error("Course content create failed:", insertError)
    return NextResponse.json({ error: "Could not publish this course content." }, { status: 500 })
  }
  return NextResponse.json({ content }, { status: 201 })
}
