import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createVerificationCode, hashVerificationCode } from "@/lib/portfolio/verification"
import { isAdminEmail } from "@/lib/admin"
import jsPDF from "jspdf"

export const runtime = "nodejs"
export async function POST(request: Request) {
  const session = await createClient(); const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: "You must be signed in to generate a portfolio." }, { status: 401 })
  if (!user.email_confirmed_at) return NextResponse.json({ error: "Verify your email before using FolioLabs." }, { status: 403 })
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Admin accounts do not generate student portfolios." }, { status: 403 })
  const body = await request.json().catch(() => ({})) as { project_ids?: unknown[] }
  const service = createServiceClient()
  const [{ data: profile }, { data: projects, error: projectError }, { data: credential }] = await Promise.all([
    service.from("profiles").select("full_name,academic_role,academic_year,verification_status").eq("id", user.id).maybeSingle(),
    service.from("researchfolio_projects").select("id,title,topic,brief,current_stage,project_data,visibility,community_review_status,created_at,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(100),
    service.from("credential_submissions").select("credential_type,institution,status").eq("user_id", user.id).eq("status", "approved").order("reviewed_at", { ascending: false }).limit(1).maybeSingle(),
  ])
  if (projectError) return NextResponse.json({ error: "Could not load saved ResearchFolio projects." }, { status: 500 })
  const displayName = String(profile?.full_name || user.user_metadata?.full_name || "FolioLabs member")
  const requestedIds = Array.isArray(body.project_ids) ? body.project_ids.filter((x): x is string => typeof x === "string") : (projects ?? []).map(p => p.id)
  const selectedRows = (projects ?? []).filter(p => requestedIds.includes(p.id))
  if (requestedIds.length !== selectedRows.length) return NextResponse.json({ error: "One or more selected projects are unavailable." }, { status: 400 })
  const selected = selectedRows.map(p => ({ id:p.id,title:p.title,topic:p.topic,summary:p.brief || "",stage:p.current_stage,status:p.community_review_status,visibility:p.visibility,created_at:p.created_at,updated_at:p.updated_at,project_data:p.project_data }))
  const code = createVerificationCode(); const { data: prior } = await service.from("portfolio_issuances").select("version").eq("user_id",user.id).order("version",{ascending:false}).limit(1).maybeSingle()
  const { error: supersedeError } = await service.from("portfolio_issuances").update({status:"superseded",superseded_at:new Date().toISOString()}).eq("user_id",user.id).eq("status","issued")
  if(supersedeError) return NextResponse.json({error:"Could not update previous portfolio verification. Apply the Phase 4 migration."},{status:500})
  const publicProjects = selected.map(p=>({id:p.id,title:p.title,topic:p.topic,summary:p.summary,status:p.status,updated_at:p.updated_at}))
  const { data: issuance,error: issueError } = await service.from("portfolio_issuances").insert({user_id:user.id,code_hash:hashVerificationCode(code),version:(prior?.version??0)+1,status:"issued",display_name:displayName,academic_level:profile?.verification_status==="approved"?(profile.academic_role||credential?.credential_type||null):null,included_projects:publicProjects,project_count:selected.length,disclose_projects:true}).select("version,issued_at").single()
  if(issueError||!issuance) return NextResponse.json({error:"Could not issue a verifiable portfolio. Apply the Phase 4 migration."},{status:500})
  const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"}); const W=doc.internal.pageSize.getWidth(), H=doc.internal.pageSize.getHeight(); const green:[number,number,number]=[0,190,100]; const dark:[number,number,number]=[13,18,22]; const muted:[number,number,number]=[95,105,112]
  let y=22; let page=1
  function header(){doc.setFillColor(...dark);doc.rect(0,0,W,H,"F");doc.setTextColor(24,38,32);doc.setFont("helvetica","bold");doc.setFontSize(30);doc.text("FOLIOLABS VERIFIED",W/2,H/2,{align:"center",angle:-30});doc.setTextColor(...green);doc.setFont("helvetica","bold");doc.setFontSize(9);doc.text("FOLIOLABS  /  VERIFIED LEARNING PORTFOLIO",18,14);doc.setDrawColor(...green);doc.setLineWidth(.5);doc.line(18,18,W-18,18);doc.setTextColor(230,235,238)}
  function footer(){doc.setDrawColor(55,65,70);doc.line(18,H-17,W-18,H-17);doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(...muted);doc.text(`Issued ${new Date(issuance.issued_at).toLocaleDateString()} · Version ${issuance.version}`,18,H-11);doc.text(`Code ${code.slice(0,8)}… · Page ${page}`,W-18,H-11,{align:"right"})}
  function addPage(){footer();doc.addPage();page++;header();y=28}
  function write(text:string,size=10,bold=false){doc.setFont("helvetica",bold?"bold":"normal");doc.setFontSize(size);doc.setTextColor(230,235,238);const lines=doc.splitTextToSize(text,W-36);for(const line of lines){if(y>H-29)addPage();doc.text(line,18,y);y+=size*.48+2.2}}
  header(); y=34; doc.setFont("helvetica","bold");doc.setFontSize(26);doc.setTextColor(255,255,255);doc.text("Learning Portfolio",18,y);y+=13;write(displayName,18,true);y+=2
  const role=profile?.verification_status==="approved"?(profile.academic_role==="undergraduate"?`Undergraduate${profile.academic_year?` · Year ${profile.academic_year}`:""}`:profile.academic_role||credential?.credential_type||"Verified academic role"):"Academic role not yet verified";write(role,10);if(credential?.institution)write(`Institution: ${credential.institution}`,9);y+=4
  doc.setFillColor(20,36,31);doc.roundedRect(18,y,W-36,27,3,3,"F");doc.setTextColor(...green);doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text("ISSUED PORTFOLIO RECORD",23,y+7);doc.setTextColor(235,240,240);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text(`Verification code: ${code}`,23,y+14);doc.text(`Verify at: ${new URL("/verify-portfolio", new URL(request.url).origin).toString()}`,23,y+21);y+=36
  write("Portfolio overview",14,true);write(`${selected.length} saved ResearchFolio project(s) included. This document is generated from project records saved to FolioLabs at the time of issuance.`,9);y+=3
  if(!selected.length)write("No ResearchFolio projects have been saved yet. This portfolio still has a valid FolioLabs-issued record, but no projects are included.",9)
  for(let i=0;i<selected.length;i++){const p=selected[i];if(y>H-50)addPage();write(`${i+1}. ${p.title||"Untitled project"}`,12,true);if(p.topic)write(`Topic: ${p.topic}`,9);if(p.summary)write(p.summary,9);write(`Stage: ${p.stage||"Not specified"} · Status: ${p.status||"Draft"} · Updated: ${new Date(p.updated_at).toLocaleDateString()}`,8);const sections=Array.isArray(p.project_data?.sections)?p.project_data.sections:[];const logs=p.project_data?.sectionLogs||{};if(sections.length){write("Project development evidence",9,true);for(const s of sections){const content=typeof s.content==="string"?s.content.trim():"";if(!content)continue;write(`${s.title||s.key||"Section"}: ${content.slice(0,1200)}`,8);const log=logs[s.key];if(log?.finalizedAt)write(`Finalized: ${new Date(log.finalizedAt).toLocaleDateString()}`,7);for(const key of ["reflection","decision","reason","changeExplanation","revisionReason"]){if(typeof log?.[key]==="string"&&log[key].trim())write(`${key}: ${log[key].trim().slice(0,700)}`,7)}}}for(const key of ["sources","citations","references","reflection","reflections","aiDisclosure","ai_disclosure","hypothesis","method","analysis","developmentTimeline"]){const value=p.project_data?.[key];if(value===undefined||value===null||value==="")continue;const textValue=typeof value==="string"?value:JSON.stringify(value);write(`${key}: ${textValue.slice(0,1400)}`,7)}y+=4}
  if(y>H-48)addPage();y+=3;doc.setDrawColor(...green);doc.roundedRect(18,y,W-36,27,2,2,"S");doc.setTextColor(...green);doc.setFont("helvetica","bold");doc.setFontSize(9);doc.text("FOLIOLABS VERIFICATION WATERMARK",23,y+7);doc.setTextColor(225,230,230);doc.setFont("helvetica","normal");doc.setFontSize(7.5);const note="Verification confirms the authenticity and current status of this FolioLabs-issued portfolio record. It does not independently certify authorship of every activity or guarantee the truth of every claim.";doc.text(doc.splitTextToSize(note,W-48),23,y+13);footer()
  return new NextResponse(new Uint8Array(doc.output("arraybuffer")),{status:200,headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=FolioLabs-Verified-Portfolio.pdf","Cache-Control":"no-store"}})
}
