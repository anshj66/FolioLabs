import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"
export async function GET(){const session=await createClient();const {data:{user}}=await session.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});if(isAdminEmail(user.email))return NextResponse.json({error:"Admin accounts do not issue student portfolios."},{status:403});const service=createServiceClient();const {data,error}=await service.from("researchfolio_projects").select("id,title,topic,brief,current_stage,updated_at,community_review_status,visibility").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(100);if(error)return NextResponse.json({error:"Could not load projects."},{status:500});return NextResponse.json({projects:data??[]})}
