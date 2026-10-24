import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"
import { isApprovedAcademic, normalizeAcademicRole } from "@/lib/platform/permissions"

export const runtime = "nodejs"
const BUCKET = "course-files"
export async function GET(_request: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  const session = await createClient(); const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ files: [] })
  const { courseId } = await context.params; const service = createServiceClient()
  const { data: course } = await service.from("courses").select("id,professor_id").eq("id", courseId).maybeSingle()
  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 })
  const { data: profile } = await session.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  const isProfessor = course.professor_id === user.id && normalizeAcademicRole(profile?.academic_role) === "professor" && isApprovedAcademic(profile)
  const { data: membership } = await service.from("course_memberships").select("user_id").eq("course_id", courseId).eq("user_id", user.id).eq("status", "enrolled").maybeSingle()
  if (!isProfessor && !membership) return NextResponse.json({ error: "You do not have access to this course." }, { status: 403 })
  const { data: files, error } = await service.from("course_files").select("id,file_name,mime_type,size_bytes,created_at,storage_path").eq("course_id", courseId).order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: "Could not load course files. Apply the Phase 3 migration." }, { status: 500 })
  const result = await Promise.all((files ?? []).map(async file => {
    const { data } = await service.storage.from(BUCKET).createSignedUrl(file.storage_path, 60 * 10)
    return { id: file.id, file_name: file.file_name, mime_type: file.mime_type, size_bytes: file.size_bytes, created_at: file.created_at, download_url: data?.signedUrl ?? null }
  }))
  return NextResponse.json({ files: result })
}

export async function POST(request: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  const session = await createClient(); const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Admin accounts cannot upload course files." }, { status: 403 })
  const { data: profile } = await session.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile) || normalizeAcademicRole(profile?.academic_role) !== "professor") return NextResponse.json({ error: "Only verified professors can attach course files." }, { status: 403 })
  const { courseId } = await context.params; const service = createServiceClient()
  const { data: course } = await service.from("courses").select("id,professor_id").eq("id", courseId).maybeSingle()
  if (!course || course.professor_id !== user.id) return NextResponse.json({ error: "Course not found or not owned by you." }, { status: 403 })
  const form = await request.formData(); const file = form.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to attach." }, { status: 400 })
  if (file.size < 1 || file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Files must be under 20 MB." }, { status: 413 })
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180) || "course-file"
  const path = `${courseId}/${crypto.randomUUID()}-${safeName}`
  const { error: uploadError } = await service.storage.from(BUCKET).upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false })
  if (uploadError) { console.error("Course file upload failed", uploadError); return NextResponse.json({ error: "Upload failed. Ensure the course-files Storage bucket exists and is private." }, { status: 500 }) }
  const { data: row, error } = await service.from("course_files").insert({ course_id: courseId, uploaded_by: user.id, file_name: safeName, storage_path: path, mime_type: file.type || "application/octet-stream", size_bytes: file.size }).select("id,file_name,mime_type,size_bytes,created_at").single()
  if (error || !row) { await service.storage.from(BUCKET).remove([path]); return NextResponse.json({ error: "Could not save file metadata." }, { status: 500 }) }
  return NextResponse.json({ file: row }, { status: 201 })
}
