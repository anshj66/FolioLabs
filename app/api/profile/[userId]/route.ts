import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

const ADMIN_EMAIL = "anshj6627@gmail.com"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL
    const canViewPrivate = Boolean(user && (user.id === userId || isAdmin))
    const db = canViewPrivate ? createServiceClient() : supabase
    let query = db.from("profiles")
      .select("id, full_name, introduction, role, interests, is_public")
      .eq("id", userId)

    if (!canViewPrivate) query = query.eq("is_public", true)
    const { data: profile, error } = await query.maybeSingle()

    if (error) {
      console.error("Profile API error:", error)
      return NextResponse.json({ error: "Failed to load profile" }, { status: 500 })
    }
    if (!profile) {
      return NextResponse.json({ error: "Profile not found or is private" }, { status: 404 })
    }

    const adminDb = createServiceClient()
    const { data: approvedCredential, error: verificationError } = await adminDb
      .from("credential_submissions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle()
    if (verificationError) throw verificationError

    return NextResponse.json({
      profile: { ...profile, is_verified: Boolean(approvedCredential) },
      isOwnProfile: user?.id === userId,
      viewerIsAdmin: isAdmin,
    })
  } catch (error) {
    console.error("Profile route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
