import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createVerificationCode, hashVerificationCode } from "@/lib/portfolio/verification"
import { isAdminEmail } from "@/lib/admin"
export async function POST(request: NextRequest) {
  const session=await createClient();const {data:{user}}=await session.auth.getUser()
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401})
  if(!user.email_confirmed_at)return NextResponse.json({error:"Verify your email before using FolioLabs."},{status:403})
  if(isAdminEmail(user.email))return NextResponse.json({error:"Administrator accounts do not issue student portfolios."},{status:403})
  const body=await request.json().catch(()=>({})) as {project_ids?:unknown[]}
  const service=createServiceClient();const [{data:profile},{data:projects,error}]=await Promise.all([service.from("profiles").select("full_name,academic_role,academic_year,verification_status").eq("id",user.id).maybeSingle(),service.from("researchfolio_projects").select("id,title,topic,brief,community_review_status,updated_at").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(100)])
  if(error)return NextResponse.json({error:"Could not load saved projects."},{status:500})
  const ids=Array.isArray(body.project_ids)?body.project_ids.filter((x):x is string=>typeof x==="string"):(projects??[]).map(p=>p.id);const selected=(projects??[]).filter(p=>ids.includes(p.id))
  if(ids.length!==selected.length)return NextResponse.json({error:"One or more selected projects are unavailable."},{status:400})
  const {data:prior}=await service.from("portfolio_issuances").select("version").eq("user_id",user.id).order("version",{ascending:false}).limit(1).maybeSingle()
  const {error:oldError}=await service.from("portfolio_issuances").update({status:"superseded",superseded_at:new Date().toISOString()}).eq("user_id",user.id).eq("status","issued")
  if(oldError)return NextResponse.json({error:"Could not supersede the previous version. Apply the Phase 4 migration."},{status:500})
  const code=createVerificationCode();const name=String(profile?.full_name||user.user_metadata?.full_name||"FolioLabs member").slice(0,100);const level=profile?.verification_status==="approved"?profile.academic_role:null
  const {data:row,error:insertError}=await service.from("portfolio_issuances").insert({user_id:user.id,code_hash:hashVerificationCode(code),version:(prior?.version??0)+1,status:"issued",display_name:name,academic_level:level,included_projects:selected.map(p=>({title:p.title,topic:p.topic,summary:p.brief||"",status:p.community_review_status,updated_at:p.updated_at})),project_count:selected.length,disclose_projects:true}).select("version,issued_at").single()
  if(insertError||!row)return NextResponse.json({error:"Could not issue verification record."},{status:500})
  return NextResponse.json({code,url:`${new URL(request.url).origin}/verify-portfolio`,version:row.version,issued_at:row.issued_at})
}
