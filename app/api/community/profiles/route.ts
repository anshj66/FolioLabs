import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

const ADMIN_EMAIL = "anshj6627@gmail.com"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")?.trim() || ""
    const role = searchParams.get("role")?.trim() || ""
    const interest = searchParams.get("interest")?.trim() || ""

    // Admins can review every profile, including profiles hidden from public discovery.
    // All other users remain restricted to public profiles.
    const db = isAdmin ? createServiceClient() : supabase
    let query = db
      .from("profiles")
      .select("id, full_name, role, interests, is_public")
      .neq("id", user.id)
      .order("full_name", { ascending: true })

    if (!isAdmin) query = query.eq("is_public", true)
    if (search) query = query.ilike("full_name", `%${search}%`)
    if (role) query = query.eq("role", role)
    if (interest) query = query.contains("interests", [interest])

    const { data: profiles, error } = await query
    if (error) {
      console.error("Community profiles error:", error)
      return NextResponse.json({ error: "Failed to load community" }, { status: 500 })
    }

    const profileRows = profiles ?? []
    const approvedUserIds = new Set<string>()
    if (profileRows.length) {
      const adminDb = createServiceClient()
      const { data: approved, error: approvedError } = await adminDb
        .from("credential_submissions")
        .select("user_id")
        .eq("status", "approved")
        .in("user_id", profileRows.map((profile) => profile.id))
      if (approvedError) throw approvedError
      for (const row of approved ?? []) approvedUserIds.add(row.user_id)
    }

    return NextResponse.json({
      profiles: profileRows.map((profile) => ({
        ...profile,
        is_verified: approvedUserIds.has(profile.id),
      })),
      viewerIsAdmin: isAdmin,
    })
  } catch (error) {
    console.error("Community GET error:", error)
    return NextResponse.json({ error: "Failed to load community" }, { status: 500 })
  }
}
