import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const TYPES = ["Undergraduate student", "Master's student", "PhD student", "Professor / Faculty", "Researcher", "Other"]
const MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 })
  const { data, error } = await supabase.from("credential_submissions").select("id, credential_type, institution, status, admin_note, created_at, reviewed_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
  if (error) return NextResponse.json({ error: "Could not load credential status. Apply the credential-verification SQL migration first." }, { status: 500 })
  return NextResponse.json({ submission: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 })
  try {
    const body = await request.json()
    if (!TYPES.includes(body.credential_type)) return NextResponse.json({ error: "Choose a valid credential type." }, { status: 400 })
    if (typeof body.institution !== "string" || body.institution.length > 160) return NextResponse.json({ error: "Institution name is too long." }, { status: 400 })
    if (typeof body.file_name !== "string" || body.file_name.length > 120 || !MIME.includes(body.mime_type)) return NextResponse.json({ error: "Invalid file metadata." }, { status: 400 })
    if (typeof body.storage_path !== "string" || !body.storage_path.startsWith(`${user.id}/`) || body.storage_path.includes("..")) return NextResponse.json({ error: "Invalid private document path." }, { status: 400 })
    const { data: existing } = await supabase.from("credential_submissions").select("id").eq("user_id", user.id).eq("status", "pending").maybeSingle()
    if (existing) return NextResponse.json({ error: "You already have a pending request. Wait for the admin to review it before submitting another." }, { status: 409 })
    const { data, error } = await supabase.from("credential_submissions").insert({ user_id: user.id, email: user.email ?? "", full_name: String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").slice(0, 160), credential_type: body.credential_type, institution: body.institution.trim(), storage_path: body.storage_path, file_name: body.file_name, mime_type: body.mime_type, status: "pending" }).select("id, credential_type, institution, status, admin_note, created_at").single()
    if (error) throw error
    return NextResponse.json({ submission: data }, { status: 201 })
  } catch (error) {
    console.error("Credential submission error:", error)
    return NextResponse.json({ error: "Could not submit credentials. Check the SQL migration and private storage bucket setup." }, { status: 500 })
  }
}
