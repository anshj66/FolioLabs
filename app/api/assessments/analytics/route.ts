import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"
import { isApprovedAcademic, normalizeAcademicRole } from "@/lib/platform/permissions"
export const dynamic = "force-dynamic"
export async function GET(request: NextRequest) {
  const session = await createClient(); const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
  if (!user.email_confirmed_at) return NextResponse.json({ error: "Verify your email before using FolioLabs." }, { status: 403 })
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Admin accounts do not access assessment analytics." }, { status: 403 })
  const { data: profile } = await session.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile) || normalizeAcademicRole(profile?.academic_role) !== "professor") return NextResponse.json({ error: "Only approved professors can view assessment analytics." }, { status: 403 })
  const id = request.nextUrl.searchParams.get("assessment_id")
  if (!id) return NextResponse.json({ error: "assessment_id is required." }, { status: 400 })
  const service = createServiceClient()
  const { data: a } = await service.from("course_assessments").select("id,course_id,professor_id,title,target_batch,closes_at,status").eq("id", id).maybeSingle()
  if (!a) return NextResponse.json({ error: "Assessment not found." }, { status: 404 })
  const { data: course } = await service.from("courses").select("id,title,professor_id").eq("id", a.course_id).maybeSingle()
  if (!course || course.professor_id !== user.id || a.professor_id !== user.id) return NextResponse.json({ error: "You cannot access this assessment." }, { status: 403 })
  if (a.status !== "published" || Date.now() < Date.parse(a.closes_at)) return NextResponse.json({ error: "Analytics are available after the assessment closes." }, { status: 409 })
  const { data: memberships, error: me } = await service.from("course_memberships").select("user_id,batch_label,status").eq("course_id", a.course_id).eq("status", "enrolled")
  if (me) return NextResponse.json({ error: "Could not load assigned students." }, { status: 500 })
  const eligible = (memberships ?? []).filter(m => a.target_batch === "All enrolled students" || (m.batch_label || "General") === a.target_batch)
  const ids = eligible.map(m => m.user_id)
  const { data: attempts, error: ae } = ids.length ? await service.from("course_assessment_attempts").select("student_id,status,score,total_points,submitted_at").eq("assessment_id", id).in("student_id", ids) : { data: [], error: null }
  if (ae) return NextResponse.json({ error: "Could not load assessment results." }, { status: 500 })
  const rows = attempts ?? []; const submitted = rows.filter(x => x.status === "submitted" && x.submitted_at); const graded = submitted.filter(x => x.score !== null && x.total_points !== null && Number(x.total_points) > 0)
  const scores = graded.map(x => Number(x.score)); const sorted = [...scores].sort((x,y)=>x-y)
  const median = sorted.length ? sorted.length % 2 ? sorted[(sorted.length-1)/2] : (sorted[sorted.length/2-1]+sorted[sorted.length/2])/2 : null
  const average = scores.length ? scores.reduce((x,y)=>x+y,0)/scores.length : null
  const distribution = [{label:"0–19%",min:0,max:20},{label:"20–39%",min:20,max:40},{label:"40–59%",min:40,max:60},{label:"60–79%",min:60,max:80},{label:"80–100%",min:80,max:101}].map(b=>({label:b.label,count:graded.filter(x=>Number(x.score)/Number(x.total_points)*100>=b.min&&Number(x.score)/Number(x.total_points)*100<b.max).length}))
  const batchMap = new Map<string,{assigned:number;submitted:number;graded:number;percentages:number[]}>()
  for(const m of eligible){const label=m.batch_label||"General";const b=batchMap.get(label)||{assigned:0,submitted:0,graded:0,percentages:[]};b.assigned++;batchMap.set(label,b)}
  for(const row of rows){const m=eligible.find(x=>x.user_id===row.student_id);if(!m)continue;const b=batchMap.get(m.batch_label||"General")!;if(row.status==="submitted")b.submitted++;if(row.status==="submitted"&&row.score!==null&&row.total_points!==null&&Number(row.total_points)>0){b.graded++;b.percentages.push(Number(row.score)/Number(row.total_points)*100)}}
  const batches=[...batchMap.entries()].map(([batch,b])=>({batch,assigned:b.assigned,submitted:b.submitted,graded:b.graded,average_percentage:b.percentages.length?b.percentages.reduce((x,y)=>x+y,0)/b.percentages.length:null}))
  return NextResponse.json({assessment:{id:a.id,title:a.title,course_title:course.title,closes_at:a.closes_at},assigned:eligible.length,submitted:submitted.length,missing:Math.max(0,eligible.length-submitted.length),graded:graded.length,ungraded:submitted.length-graded.length,average,median,highest:scores.length?Math.max(...scores):null,lowest:scores.length?Math.min(...scores):null,distribution,batches,score_basis:"Valid submitted attempts with a recorded score and positive total_points. Missing and ungraded submissions are excluded."})
}
