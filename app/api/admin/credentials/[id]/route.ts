import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: "Admin access required." }, { status: 403 })
  try {
    const { id } = await context.params
    const body = await request.json()
    if (!['approved', 'rejected'].includes(body.status)) return NextResponse.json({ error: "Status must be approved or rejected." }, { status: 400 })
    const note = typeof body.admin_note === "string" ? body.admin_note.trim().slice(0, 1000) : ""
    const admin = createServiceClient()
    const { data, error } = await admin.from("credential_submissions").update({ status: body.status, admin_note: note, reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("id", id).select("id,status,admin_note,reviewed_at").single()
    if (error) throw error
    return NextResponse.json({ submission: data })
  } catch (error) {
    console.error("Credential review error:", error)
    return NextResponse.json({ error: "Could not update request." }, { status: 500 })
  }
}
