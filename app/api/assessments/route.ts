import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"
import { isApprovedAcademic, normalizeAcademicRole } from "@/lib/platform/permissions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
type Question = { id: string; concept: string; prompt: string; options: string[]; correctIndex: number; explanation?: string; points: number }
type Variant = { key: string; label: string; questions: Question[] }

async function context() {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return { user: null, profile: null, service: createServiceClient() }
  const { data: profile } = await session.from("profiles").select("academic_role,academic_year,verification_status").eq("id", user.id).maybeSingle()
  return { user, profile, service: createServiceClient() }
}

export async function GET() {
  const { user, profile, service } = await context()
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
  if (!user.email_confirmed_at) return NextResponse.json({ error: "Verify your email before using FolioLabs." }, { status: 403 })
  if (isAdminEmail(user.email)) return NextResponse.json({ courses: [], assessments: [], admin: true })
  if (!isApprovedAcademic(profile)) return NextResponse.json({ error: "Your academic role must be approved first." }, { status: 403 })
  const role = normalizeAcademicRole(profile?.academic_role)
  if (role === "professor") {
    const { data: courses } = await service.from("courses").select("id,title,course_code").eq("professor_id", user.id).order("created_at", { ascending: false })
    const ids = (courses ?? []).map(c => c.id)
    const { data: assessments, error } = ids.length ? await service.from("course_assessments").select("id,course_id,title,instructions,concepts,target_batch,assigned_variant_key,duration_minutes,opens_at,closes_at,status,created_at,questions").in("course_id", ids).order("created_at", { ascending: false }) : { data: [], error: null }
    if (error) return NextResponse.json({ error: "Apply the Phase 3 assessment migration first." }, { status: 500 })
    return NextResponse.json({ courses: courses ?? [], assessments: (assessments ?? []).map(a => ({ ...a, questions: undefined, question_count: Array.isArray(a.questions) ? (a.questions[0]?.questions?.length ?? 0) : 0 })) , professor: true })
  }
  const { data: memberships, error: membershipError } = await service.from("course_memberships").select("course_id,batch_label,status").eq("user_id", user.id).eq("status", "enrolled")
  if (membershipError) return NextResponse.json({ error: "Could not load your course enrollments." }, { status: 500 })
  const courseIds = (memberships ?? []).map(m => m.course_id)
  const batchByCourse = new Map((memberships ?? []).map(m => [m.course_id, m.batch_label || "General"]))
  const [{ data: courses }, { data: allAssessments, error }] = await Promise.all([
    courseIds.length ? service.from("courses").select("id,title,course_code,professor_id").in("id", courseIds) : Promise.resolve({ data: [], error: null } as any),
    courseIds.length ? service.from("course_assessments").select("id,course_id,title,instructions,concepts,target_batch,duration_minutes,opens_at,closes_at,status,questions,created_at").in("course_id", courseIds).eq("status", "published").order("opens_at", { ascending: true }) : Promise.resolve({ data: [], error: null } as any),
  ])
  if (error) return NextResponse.json({ error: "Could not load assessments." }, { status: 500 })
  const eligible = (allAssessments ?? []).filter(a => a.target_batch === "All enrolled students" || a.target_batch === batchByCourse.get(a.course_id))
  const ids = eligible.map(a => a.id)
  const { data: attempts } = ids.length ? await service.from("course_assessment_attempts").select("id,assessment_id,status,score,total_points,started_at,submitted_at").eq("student_id", user.id).in("assessment_id", ids) : { data: [] as any[] }
  const attemptMap = new Map((attempts ?? []).map(a => [a.assessment_id, a]))
  const courseMap = new Map((courses ?? []).map(c => [c.id, c]))
  return NextResponse.json({ courses: courses ?? [], assessments: eligible.map(a => ({ ...a, questions: undefined, question_count: Array.isArray(a.questions) ? (a.questions[0]?.questions?.length ?? 0) : 0, course_title: courseMap.get(a.course_id)?.title ?? "Course", attempt: attemptMap.get(a.id) ?? null, batch_label: batchByCourse.get(a.course_id) })) })
}

export async function POST(request: NextRequest) {
  const { user, profile, service } = await context()
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
  if (!user.email_confirmed_at) return NextResponse.json({ error: "Verify your email before using FolioLabs." }, { status: 403 })
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Admin accounts cannot create or take academic assessments." }, { status: 403 })
  if (!isApprovedAcademic(profile) || normalizeAcademicRole(profile?.academic_role) !== "professor") return NextResponse.json({ error: "Only verified professors can create course assessments." }, { status: 403 })
  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }) }
  const courseId = typeof body.course_id === "string" ? body.course_id : ""
  const { data: course } = await service.from("courses").select("id,title,professor_id").eq("id", courseId).maybeSingle()
  if (!course || course.professor_id !== user.id) return NextResponse.json({ error: "Choose a course you teach." }, { status: 403 })

  if (body.action === "generate") {
    const title = String(body.title ?? "Understanding check").trim().slice(0, 180)
    const concepts = Array.isArray(body.concepts) ? body.concepts.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 12) : []
    const count = Math.max(3, Math.min(20, Number(body.question_count) || 8))
    const difficulty = ["introductory", "intermediate", "advanced", "mixed"].includes(body.difficulty) ? body.difficulty : "mixed"
    if (!concepts.length) return NextResponse.json({ error: "Add at least one concept or learning outcome." }, { status: 400 })
    const key = process.env.GEMINI_API_KEY
    if (!key) return NextResponse.json({ error: "GEMINI_API_KEY is not configured. Add it to your local .env and deployment environment." }, { status: 503 })
    const prompt = `Create a rigorous university-level assessment for course ${JSON.stringify(course.title)}. Title: ${JSON.stringify(title)}. Concepts/learning outcomes: ${JSON.stringify(concepts)}. Difficulty: ${difficulty}. Make ${count} questions in each of THREE variants (A, B, C). Across variants, test the same concepts and comparable difficulty but change numbers, contexts, matrices, datasets, or wording so students in different batches do not receive identical questions. Return ONLY valid JSON: {"variants":[{"key":"A","label":"Variant A","questions":[{"id":"q1","concept":"...","prompt":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"...","points":1}]}]}. Each variant must have ${count} multiple-choice questions with exactly 4 options and one correctIndex 0-3. Avoid trick ambiguity. `
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.55, responseMimeType: "application/json" } }), signal: AbortSignal.timeout(60_000) })
      const result = await response.json()
      if (!response.ok) throw new Error(result?.error?.message || "AI generation failed")
      const text = result?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || ""
      const parsed = JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""))
      const variants = (parsed.variants ?? []).filter((v: any) => typeof v.key === "string" && Array.isArray(v.questions) && v.questions.length >= 3).slice(0, 3)
      if (variants.length < 2 || variants.some((v: any) => v.questions.some((q: any) => !q.prompt || !Array.isArray(q.options) || q.options.length !== 4 || !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3))) throw new Error("AI returned an invalid assessment format. Please generate again.")
      return NextResponse.json({ title, concepts, variants })
    } catch (error) { console.error("Assessment generation error", error); return NextResponse.json({ error: error instanceof Error ? error.message : "Could not generate the assessment." }, { status: 502 }) }
  }

  if (body.action === "publish") {
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 180) : ""
    const instructions = typeof body.instructions === "string" ? body.instructions.trim().slice(0, 5000) : ""
    const variants = Array.isArray(body.variants) ? body.variants as Variant[] : []
    const concepts = Array.isArray(body.concepts) ? body.concepts.map((v: unknown) => String(v).slice(0, 160)).slice(0, 12) : []
    const duration = Math.max(1, Math.min(360, Number(body.duration_minutes) || 30))
    if (!Number.isFinite(Date.parse(String(body.opens_at))) || !Number.isFinite(Date.parse(String(body.closes_at)))) return NextResponse.json({ error: "Choose valid opening and closing times." }, { status: 400 })
    const opensAt = new Date(body.opens_at).toISOString()
    const closesAt = new Date(body.closes_at).toISOString()
    const batch = typeof body.target_batch === "string" ? body.target_batch.trim().slice(0, 100) : "All enrolled students"
    const assignedVariantKey = typeof body.assigned_variant_key === "string" ? body.assigned_variant_key : "A"
    if (title.length < 3 || variants.length < 2 || variants.some(v => !Array.isArray(v.questions) || !v.questions.length) || !variants.some(v => v.key === assignedVariantKey)) return NextResponse.json({ error: "Generate and review at least two question variants before publishing." }, { status: 400 })
    if (!Number.isFinite(Date.parse(String(body.opens_at))) || !Number.isFinite(Date.parse(String(body.closes_at))) || Date.parse(closesAt) <= Date.parse(opensAt)) return NextResponse.json({ error: "Choose a valid opening and closing time." }, { status: 400 })
    const { data: membershipRows, error: membershipError } = await service.from("course_memberships").select("user_id,batch_label,status").eq("course_id", courseId).eq("status", "enrolled")
    if (membershipError) return NextResponse.json({ error: "Could not validate course batches." }, { status: 500 })
    if (batch !== "All enrolled students" && !(membershipRows ?? []).some(m => (m.batch_label || "General") === batch)) return NextResponse.json({ error: "That batch has no enrolled students in this course." }, { status: 400 })
    const { data: assessment, error } = await service.from("course_assessments").insert({ course_id: courseId, professor_id: user.id, title, instructions, concepts, questions: variants, target_batch: batch || "All enrolled students", assigned_variant_key: assignedVariantKey, duration_minutes: duration, opens_at: opensAt, closes_at: closesAt, status: "published" }).select("id,title,course_id,target_batch,duration_minutes,opens_at,closes_at,status,created_at").single()
    if (error || !assessment) { console.error("Assessment publish error", error); return NextResponse.json({ error: "Could not publish. Apply the Phase 3 migration first." }, { status: 500 }) }
    return NextResponse.json({ assessment }, { status: 201 })
  }
  return NextResponse.json({ error: "Unsupported assessment action." }, { status: 400 })
}
