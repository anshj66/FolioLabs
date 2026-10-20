import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"

const roleFromCredential: Record<string, string> = {
  "Undergraduate student": "undergraduate",
  "Master's student": "masters",
  "PhD student": "phd",
  "Professor / Faculty": "professor",
}
const displayRole: Record<string, string> = {
  undergraduate: "Undergraduate student",
  masters: "Master's student",
  phd: "PhD student",
  professor: "Professor / Faculty",
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: "Admin access required." }, { status: 403 })

  try {
    const { id } = await context.params
    const body = await request.json()
    if (!["approved", "rejected"].includes(body.status)) return NextResponse.json({ error: "Status must be approved or rejected." }, { status: 400 })
    const note = typeof body.admin_note === "string" ? body.admin_note.trim().slice(0, 1000) : ""
    const admin = createServiceClient()
    const { data: current, error: readError } = await admin.from("credential_submissions").select("id,user_id,credential_type,requested_role,academic_year,storage_path").eq("id", id).single()
    if (readError || !current) throw readError ?? new Error("Credential request not found.")

    const requestedRole = current.requested_role || roleFromCredential[current.credential_type]
    if (body.status === "approved" && (!requestedRole || !displayRole[requestedRole])) return NextResponse.json({ error: "The request has no valid academic role. Ask the user to resubmit." }, { status: 400 })
    if (body.status === "approved" && requestedRole === "undergraduate" && (!Number.isInteger(current.academic_year) || current.academic_year < 1 || current.academic_year > 5)) return NextResponse.json({ error: "This undergraduate request has no valid academic year. Ask the user to resubmit." }, { status: 400 })

    const { data, error } = await admin.from("credential_submissions").update({ status: body.status, admin_note: note, reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("id", id).select("id,user_id,credential_type,status,admin_note,reviewed_at").single()
    if (error) throw error

    if (body.status === "approved") {
      const { error: profileError } = await admin.from("profiles").update({ role: requestedRole === "professor" ? "Professor" : "Student", academic_role: requestedRole, academic_year: requestedRole === "undergraduate" ? current.academic_year : null, verification_status: "approved", role_approved_at: new Date().toISOString(), role_verified_by: user.id, updated_at: new Date().toISOString() }).eq("id", current.user_id)
      if (profileError) throw profileError
    } else {
      await admin.from("profiles").update({ verification_status: "rejected", updated_at: new Date().toISOString() }).eq("id", current.user_id)
    }

    // Delete the private document bytes after the final decision; keep only review metadata.
    let documentDeleted = false
    if (current.storage_path) {
      const { error: removeError } = await admin.storage.from("credential-documents").remove([current.storage_path])
      if (!removeError) {
        documentDeleted = true
        await admin.from("credential_submissions").update({ storage_path: null }).eq("id", id)
      } else {
        console.error("Credential document deletion failed:", removeError)
      }
    }
    await admin.from("platform_audit_log").insert({ actor_id: user.id, action: `credential.${body.status}`, target_type: "credential_submission", target_id: id, details: { user_id: current.user_id, requested_role: requestedRole, document_deleted: documentDeleted, admin_note: note } })
    return NextResponse.json({ submission: data, document_deleted: documentDeleted, warning: current.storage_path && !documentDeleted ? "The decision was saved, but document deletion failed. Retry deletion from storage administration." : undefined })
  } catch (error) {
    console.error("Credential review error:", error)
    return NextResponse.json({ error: "Could not update request. Check the credential table and profiles schema." }, { status: 500 })
  }
}
