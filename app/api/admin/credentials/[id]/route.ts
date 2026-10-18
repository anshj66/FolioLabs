import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"

const roleFromCredential: Record<string, string> = {
  "Undergraduate student": "Undergraduate student",
  "Master's student": "Master's student",
  "PhD student": "PhD student",
  "Professor / Faculty": "Professor / Faculty",
  "Researcher": "Researcher",
  "Other": "Other",
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
    const { data: current, error: readError } = await admin.from("credential_submissions").select("id,user_id,credential_type").eq("id", id).single()
    if (readError || !current) throw readError ?? new Error("Credential request not found.")

    const { data, error } = await admin.from("credential_submissions").update({ status: body.status, admin_note: note, reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("id", id).select("id,user_id,credential_type,status,admin_note,reviewed_at").single()
    if (error) throw error

    if (body.status === "approved") {
      const verifiedRole = roleFromCredential[current.credential_type]
      if (!verifiedRole) return NextResponse.json({ error: "The submitted credential type cannot be used as a verified role." }, { status: 400 })
      const { error: profileError } = await admin.from("profiles").update({ role: verifiedRole, updated_at: new Date().toISOString() }).eq("id", current.user_id)
      if (profileError) throw profileError
    }
    return NextResponse.json({ submission: data })
  } catch (error) {
    console.error("Credential review error:", error)
    return NextResponse.json({ error: "Could not update request. Check the credential table and profiles schema." }, { status: 500 })
  }
}
