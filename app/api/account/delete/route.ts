import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"

export const runtime = "nodejs"
async function purgeUser(service: ReturnType<typeof createServiceClient>, userId: string) {
  // Delete dependent rows first. Academic assessment records are removed on permanent account deletion;
  // institutions should export required records before deletion under their retention policy.
  const { data: projects } = await service.from("researchfolio_projects").select("id").eq("user_id", userId)
  const projectIds = (projects ?? []).map(p => p.id)
  if (projectIds.length) {
    const {data: linkedSessions}=await service.from("mentor_sessions").select("id").in("researchfolio_project_id",projectIds)
    const linkedSessionIds=(linkedSessions??[]).map(s=>s.id)
    if(linkedSessionIds.length){const {error}=await service.from("mentor_messages").delete().in("session_id",linkedSessionIds);if(error)throw new Error(`Could not remove project-linked mentor messages: ${error.message}`);const {error:se}=await service.from("mentor_sessions").delete().in("id",linkedSessionIds);if(se)throw new Error(`Could not remove project-linked mentor sessions: ${se.message}`)}
  }
  if (projectIds.length) {
    await service.from("researchfolio_defense_sessions").delete().in("project_id", projectIds)
    await service.from("researchfolio_feedback").delete().in("project_id", projectIds)
  }
  { const { error } = await service.from("researchfolio_feedback").delete().or(`author_id.eq.${userId},reviewer_id.eq.${userId}`); if(error) throw new Error(`Could not clean research feedback: ${error.message}`) }
  { const { error } = await service.from("researchfolio_defense_sessions").delete().eq("user_id",userId); if(error) throw new Error(`Could not clean defense sessions: ${error.message}`) }
  if (projectIds.length) { const { error } = await service.from("researchfolio_projects").delete().eq("user_id",userId); if(error) throw new Error(`Could not remove projects: ${error.message}`) }
  const sessions = await service.from("mentor_sessions").select("id").eq("user_id",userId)
  const sessionIds=(sessions.data??[]).map(s=>s.id)
  if(sessionIds.length){const {error}=await service.from("mentor_messages").delete().in("session_id",sessionIds);if(error)throw new Error(`Could not remove mentor messages: ${error.message}`)}
  const {data: creds}=await service.from("credential_submissions").select("storage_path").eq("user_id",userId)
  if(creds?.length){const paths=creds.map(c=>c.storage_path).filter(Boolean) as string[];if(paths.length){await service.storage.from("credential-documents").remove(paths)}}
  for (const [table, column] of [["mentor_messages","user_id"],["mentor_sessions","user_id"],["follows","follower_id"],["follows","following_id"],["messages","sender_id"],["course_memberships","user_id"],["course_assessment_attempts","student_id"],["credential_submissions","user_id"],["merit_credit_ledger","user_id"],["portfolio_issuances","user_id"]] as const) {
    const { error } = await service.from(table).delete().eq(column,userId)
    if(error) throw new Error(`Could not clean ${table}: ${error.message}`)
  }
  // Remove conversations and messages for which this account was a participant.
  const {data: conversations}=await service.from("conversations").select("id").or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
  const conversationIds=(conversations??[]).map(c=>c.id)
  if(conversationIds.length){const {error}=await service.from("messages").delete().in("conversation_id",conversationIds);if(error)throw new Error(`Could not remove chat messages: ${error.message}`);const {error:ce}=await service.from("conversations").delete().in("id",conversationIds);if(ce)throw new Error(`Could not remove conversations: ${ce.message}`)}
  // Remove content and attachments uploaded by this account in courses owned by others.
  const {data: ownCourseFiles}=await service.from("course_files").select("id,storage_path").eq("uploaded_by",userId)
  if(ownCourseFiles?.length){const paths=ownCourseFiles.map(f=>f.storage_path).filter(Boolean);if(paths.length)await service.storage.from("course-files").remove(paths);const {error}=await service.from("course_files").delete().eq("uploaded_by",userId);if(error)throw new Error(`Could not remove uploaded course files: ${error.message}`)}
  {const {error}=await service.from("course_content").delete().eq("author_id",userId);if(error)throw new Error(`Could not remove authored course content: ${error.message}`)}
  // Remove course-owned records where deleting the user would otherwise leave broken references.
  const {data: courses}=await service.from("courses").select("id").eq("professor_id",userId);const courseIds=(courses??[]).map(c=>c.id)
  if(courseIds.length){
    const {data: files}=await service.from("course_files").select("storage_path").in("course_id",courseIds)
    if(files?.length){{const paths=files.map(f=>f.storage_path).filter(Boolean);if(paths.length)await service.storage.from("course-files").remove(paths)}}
    await service.from("course_assessment_attempts").delete().in("assessment_id",(await service.from("course_assessments").select("id").in("course_id",courseIds)).data?.map(a=>a.id)??[])
    await service.from("course_assessments").delete().in("course_id",courseIds);await service.from("course_content").delete().in("course_id",courseIds);await service.from("course_files").delete().in("course_id",courseIds);await service.from("course_memberships").delete().in("course_id",courseIds);await service.from("courses").delete().in("id",courseIds)
  }
  await service.from("opportunities").update({created_by:null}).eq("created_by",userId)
  await service.from("merit_credit_ledger").update({created_by:null}).eq("created_by",userId)
  await service.from("credential_submissions").update({reviewed_by:null}).eq("reviewed_by",userId)
  await service.from("profiles").update({role_verified_by:null}).eq("role_verified_by",userId)
  await service.from("platform_audit_log").update({actor_id:null}).eq("actor_id",userId)
  const {error:profileError}=await service.from("profiles").delete().eq("id",userId)
  if(profileError) throw new Error(`Could not remove profile: ${profileError.message}`)
  const {error:authError}=await service.auth.admin.deleteUser(userId)
  if(authError) throw new Error(`Personal data cleanup finished but Auth deletion failed: ${authError.message}`)
}

export async function POST(request: NextRequest) {
  const session=await createClient();const {data:{user}}=await session.auth.getUser()
  if(!user)return NextResponse.json({error:"Please sign in again before deleting your account."},{status:401})
  if(!user.email_confirmed_at)return NextResponse.json({error:"Verify your email before using FolioLabs."},{status:403})
  const body=await request.json().catch(()=>({}))
  if(body.confirmation!=="DELETE")return NextResponse.json({error:"Type DELETE to confirm permanent account deletion."},{status:400})
  const admin=isAdminEmail(user.email)
  if(body.target_user_id && !admin)return NextResponse.json({error:"Only an administrator can delete another account."},{status:403})
  const target=typeof body.target_user_id==="string"?body.target_user_id:user.id
  if(admin && target===user.id)return NextResponse.json({error:"The designated administrator account is protected from self-deletion. Transfer admin ownership first."},{status:409})
  if(!admin && target!==user.id)return NextResponse.json({error:"You can only delete your own account."},{status:403})
  // Require a recent sign-in as a practical reauthentication check.
// Require recent authentication for personal account deletion.
// Admins deleting other users must still be authenticated and
// explicitly confirm the deletion.
if (!admin || target === user.id) {
  const signedInAt = user.last_sign_in_at
    ? Date.parse(user.last_sign_in_at)
    : 0

  if (
    !Number.isFinite(signedInAt) ||
    Date.now() - signedInAt > 15 * 60_000
  ) {
    return NextResponse.json(
      {
        error:
          "For security, sign out and sign in again before deleting this account.",
      },
      { status: 403 }
    )
  }
}  const service=createServiceClient()
  const {data:targetUser}=await service.auth.admin.getUserById(target)
  if(!targetUser.user)return NextResponse.json({error:"Account not found."},{status:404})
  if(isAdminEmail(targetUser.user.email)&&target!==user.id)return NextResponse.json({error:"The designated administrator account cannot be deleted through user management."},{status:409})
  const {data:job}=await service.from("account_deletion_jobs").insert({target_user_id:target,requested_by:user.id,status:"pending",details:{request_type:admin?"admin_deletion":"self_deletion"}}).select("id").single()
  try { await purgeUser(service,target);if(job)await service.from("account_deletion_jobs").update({status:"completed",target_user_id:null,requested_by:null,completed_at:new Date().toISOString(),details:{request_type:admin?"admin_deletion":"self_deletion",completed:true}}).eq("id",job.id);return NextResponse.json({success:true}) }
  catch(error){if(job)await service.from("account_deletion_jobs").update({status:"failed",details:{error:error instanceof Error?error.message:"Unknown cleanup error"}}).eq("id",job.id);return NextResponse.json({error:error instanceof Error?error.message:"Account cleanup failed. Contact support before retrying."},{status:500})}
}
