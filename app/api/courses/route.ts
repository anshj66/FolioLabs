import { randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"
import { isApprovedAcademic, normalizeAcademicRole } from "@/lib/platform/permissions"

export const runtime = "nodejs"

async function currentContext() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null, profile: null }
  const { data: profile } = await supabase.from("profiles").select("academic_role,academic_year,verification_status,full_name").eq("id", user.id).maybeSingle()
  return { supabase, user, profile }
}

function makeCourseCode() {
  return randomBytes(5).toString("hex").toUpperCase()
}

export async function GET() {
  const { supabase, user, profile } = await currentContext()
  if (!user) return NextResponse.json({ error: "Please sign in to view courses." }, { status: 401 })
  try {
    const [owned, memberships] = await Promise.all([
      supabase.from("courses").select("id,title,description,course_code,status,created_at,updated_at").eq("professor_id", user.id).order("created_at", { ascending: false }),
      supabase.from("course_memberships").select("course_id,status,joined_at,courses(id,title,description,course_code,status,professor_id,created_at,updated_at)").eq("user_id", user.id).eq("status", "enrolled").order("joined_at", { ascending: false }),
    ])
    if (owned.error) throw owned.error
    if (memberships.error) throw memberships.error
    return NextResponse.json({ owned: owned.data ?? [], enrolled: memberships.data ?? [], can_create: isApprovedAcademic(profile) && normalizeAcademicRole(profile?.academic_role) === "professor", can_join: isApprovedAcademic(profile) && normalizeAcademicRole(profile?.academic_role) !== "professor" })
  } catch (error) {
    console.error("Courses GET failed:", error)
    return NextResponse.json({ error: "Could not load courses. Apply the FolioLabs platform migration and try again." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user, profile } = await currentContext()
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Administrator accounts cannot enroll as academic users or create professor courses." }, { status: 403 })
  if (!isApprovedAcademic(profile)) return NextResponse.json({ error: "Your academic role must be approved before using courses." }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }) }
  const action = body.action
  const service = createServiceClient()

  if (action === "create") {
    if (normalizeAcademicRole(profile?.academic_role) !== "professor") return NextResponse.json({ error: "Only verified professors can create courses." }, { status: 403 })
    const title = typeof body.title === "string" ? body.title.trim() : ""
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 5000) : ""
    if (title.length < 3 || title.length > 160) return NextResponse.json({ error: "Course title must be between 3 and 160 characters." }, { status: 400 })
    let course: Record<string, unknown> | null = null
    let lastError: unknown = null
    for (let attempt = 0; attempt < 3 && !course; attempt++) {
      const result = await service.from("courses").insert({ professor_id: user.id, title, description, course_code: makeCourseCode(), status: "published" }).select("id,title,description,course_code,status,created_at").single()
      if (!result.error) course = result.data
      else lastError = result.error
    }
    if (!course) {
      console.error("Course create failed:", lastError)
      return NextResponse.json({ error: "Could not create the course. Check that the platform migration is applied." }, { status: 500 })
    }
    await service.from("platform_audit_log").insert({ actor_id: user.id, action: "course.created", target_type: "course", target_id: String(course.id), details: { title } })
    return NextResponse.json({ course }, { status: 201 })
  }

  if (action === "join") {
    const code = typeof body.course_code === "string" ? body.course_code.trim().toUpperCase() : ""
    if (!/^[A-F0-9]{10}$/.test(code)) return NextResponse.json({ error: "Enter the 10-character course code." }, { status: 400 })
    if (normalizeAcademicRole(profile?.academic_role) === "professor") return NextResponse.json({ error: "Professor accounts cannot join courses as students." }, { status: 403 })
    const { data: course, error: courseError } = await service.from("courses").select("id,title,status").eq("course_code", code).maybeSingle()
    if (courseError) {
      console.error("Course lookup failed:", courseError)
      return NextResponse.json({ error: "Could not validate this course code." }, { status: 500 })
    }
    if (!course || course.status !== "published") return NextResponse.json({ error: "That course code is invalid or the course is not accepting enrollments." }, { status: 404 })
    const { error: membershipError } = await service.from("course_memberships").upsert({ course_id: course.id, user_id: user.id, status: "enrolled" }, { onConflict: "course_id,user_id", ignoreDuplicates: true })
    if (membershipError) {
      console.error("Course enrollment failed:", membershipError)
      return NextResponse.json({ error: "Could not enroll in this course." }, { status: 500 })
    }
    return NextResponse.json({ joined: true, course })
  }

  return NextResponse.json({ error: "Unsupported course action." }, { status: 400 })
}
