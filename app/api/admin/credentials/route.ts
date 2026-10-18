import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"

export async function GET() {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: "Admin access required." }, { status: 403 })
  try {
    const admin = createServiceClient()
    const { data: rows, error } = await admin.from("credential_submissions").select("id,user_id,email,full_name,credential_type,institution,file_name,mime_type,status,admin_note,created_at,reviewed_at,storage_path").order("created_at", { ascending: false })
    if (error) throw error
    const submissions = await Promise.all((rows ?? []).map(async row => {
      const { data } = await admin.storage.from("credential-documents").createSignedUrl(row.storage_path ?? "", 60 * 5)
      return { ...row, document_url: data?.signedUrl ?? null }
    }))
    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Admin credential queue error:", error)
    return NextResponse.json({ error: "Could not load requests. Ensure SUPABASE_SERVICE_ROLE_KEY is set on the server." }, { status: 500 })
  }
}
