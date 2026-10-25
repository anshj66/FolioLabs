import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email_confirmed_at) {
        // Google OAuth's provider-confirmed email satisfies FolioLabs email verification.
        const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle()
        if (!profile) {
          const name = String(user.user_metadata?.full_name || user.user_metadata?.name || "").slice(0, 100)
          const { error: profileError } = await supabase.from("profiles").insert({ id: user.id, full_name: name, role: "Student", interests: [], is_public: false, verification_status: "pending_upload" })
          if (profileError) return NextResponse.redirect(new URL("/signin?error=profile", request.url))
        }
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
      await supabase.auth.signOut()
    }
  }
  return NextResponse.redirect(new URL("/signin?error=auth", request.url))
}
