import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"
import { isApprovedAcademic, normalizeAcademicRole } from "@/lib/platform/permissions"

export const runtime = "nodejs"
export async function GET(_request: NextRequest, context: { params: Promise<{ assessmentId: string }> }) {
  const session = await createClient(); const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Admin accounts cannot take assessments." }, { status: 403 })
  const { data: profile } = await session.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile) || normalizeAcademicRole(profile?.academic_role) === "professor") return NextResponse.json({ error: "Only approved student accounts can take course assessments." }, { status: 403 })
  const { assessmentId } = await context.params; const service = createServiceClient()
  const { data: assessment } = await service.from("course_assessments").select("*").eq("id", assessmentId).eq("status", "published").maybeSingle()
  if (!assessment) return NextResponse.json({ error: "Assessment not found." }, { status: 404 })
  const { data: membership } = await service.from("course_memberships").select("batch_label,status").eq("course_id", assessment.course_id).eq("user_id", user.id).eq("status", "enrolled").maybeSingle()
  if (!membership || (assessment.target_batch !== "All enrolled students" && assessment.target_batch !== (membership.batch_label || "General"))) return NextResponse.json({ error: "This assessment is not assigned to your course batch." }, { status: 403 })
  const now = Date.now(); if (now < Date.parse(assessment.opens_at)) return NextResponse.json({ error: "This assessment has not opened yet.", opens_at: assessment.opens_at }, { status: 403 })
  if (now >= Date.parse(assessment.closes_at)) return NextResponse.json({ error: "The assessment window has closed.", closes_at: assessment.closes_at }, { status: 403 })
  const { data: attempt } = await service.from("course_assessment_attempts").select("id,variant_key,answers,score,total_points,started_at,submitted_at,status").eq("assessment_id", assessmentId).eq("student_id", user.id).maybeSingle()
  const variants = Array.isArray(assessment.questions) ? assessment.questions : []
  const selectedVariant = attempt ? variants.find((v: any) => v.key === attempt.variant_key) : null
  const remainingSeconds = attempt ? Math.max(0, assessment.duration_minutes * 60 - Math.floor((now - Date.parse(attempt.started_at)) / 1000)) : assessment.duration_minutes * 60
  return NextResponse.json({ assessment: { id: assessment.id, title: assessment.title, instructions: assessment.instructions, concepts: assessment.concepts, duration_minutes: assessment.duration_minutes, opens_at: assessment.opens_at, closes_at: assessment.closes_at, course_id: assessment.course_id }, attempt, remaining_seconds: remainingSeconds, questions: selectedVariant?.questions?.map((q: any) => ({ id: q.id, concept: q.concept, prompt: q.prompt, options: q.options, points: q.points })) ?? null })
}

export async function POST(request: NextRequest, context: { params: Promise<{ assessmentId: string }> }) {
  const session = await createClient(); const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Admin accounts cannot take assessments." }, { status: 403 })
  const { data: profile } = await session.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile) || normalizeAcademicRole(profile?.academic_role) === "professor") return NextResponse.json({ error: "Only approved student accounts can take assessments." }, { status: 403 })
  const { assessmentId } = await context.params; const service = createServiceClient()
  const { data: assessment } = await service.from("course_assessments").select("*").eq("id", assessmentId).eq("status", "published").maybeSingle()
  if (!assessment) return NextResponse.json({ error: "Assessment not found." }, { status: 404 })
  const now = Date.now(); if (now < Date.parse(assessment.opens_at) || now >= Date.parse(assessment.closes_at)) return NextResponse.json({ error: "The assessment is outside its scheduled availability window." }, { status: 403 })
  const { data: membership } = await service.from("course_memberships").select("batch_label,status").eq("course_id", assessment.course_id).eq("user_id", user.id).eq("status", "enrolled").maybeSingle()
  if (!membership || (assessment.target_batch !== "All enrolled students" && assessment.target_batch !== (membership.batch_label || "General"))) return NextResponse.json({ error: "This assessment is not assigned to your batch." }, { status: 403 })
  let body: any; try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }) }
  const { data: existing } = await service.from("course_assessment_attempts").select("*").eq("assessment_id", assessmentId).eq("student_id", user.id).maybeSingle()
  if (body.action === "start") {
    if (existing) return NextResponse.json({ attempt: existing, already_started: true })
    const variants = Array.isArray(assessment.questions) ? assessment.questions : []
    if (!variants.length) return NextResponse.json({ error: "This assessment has no question variants." }, { status: 500 })
    // Stable, server-selected assignment: one variant per student, persisted on first start.
    const hash = [...user.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7)
    const variant = assessment.target_batch === "All enrolled students" ? variants[hash % variants.length] : (variants.find((v: any) => v.key === assessment.assigned_variant_key) || variants[hash % variants.length])
    const { data: attempt, error } = await service.from("course_assessment_attempts").insert({ assessment_id: assessmentId, student_id: user.id, variant_key: variant.key, answers: {}, status: "in_progress" }).select("id,variant_key,started_at,status").single()
    if (error || !attempt) return NextResponse.json({ error: "Could not start assessment." }, { status: 500 })
    return NextResponse.json({ attempt, questions: variant.questions.map((q: any) => ({ id: q.id, concept: q.concept, prompt: q.prompt, options: q.options, points: q.points })) }, { status: 201 })
  }
  if (body.action === "submit") {
    if (!existing || existing.status !== "in_progress") return NextResponse.json({ error: "Start the assessment before submitting." }, { status: 409 })
    const deadline = Math.min(Date.parse(assessment.closes_at), Date.parse(existing.started_at) + assessment.duration_minutes * 60_000)
    if (now > deadline + 30_000) return NextResponse.json({ error: "The assessment time limit has expired." }, { status: 403 })
    const variants = Array.isArray(assessment.questions) ? assessment.questions : []
    const variant = variants.find((v: any) => v.key === existing.variant_key)
    if (!variant) return NextResponse.json({ error: "Assigned question variant was not found." }, { status: 500 })
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {}
    let score = 0, total = 0
    for (const q of variant.questions) { total += Number(q.points) || 1; if (Number(answers[q.id]) === Number(q.correctIndex)) score += Number(q.points) || 1 }
    const { data: submitted, error } = await service.from("course_assessment_attempts").update({ answers, score, total_points: total, status: "submitted", submitted_at: new Date().toISOString() }).eq("id", existing.id).eq("status", "in_progress").select("id,status,score,total_points,submitted_at").single()
    if (error || !submitted) return NextResponse.json({ error: "Could not record your submission." }, { status: 500 })
    return NextResponse.json({ attempt: submitted })
  }
  return NextResponse.json({ error: "Unsupported attempt action." }, { status: 400 })
}
