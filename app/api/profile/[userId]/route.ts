import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { userId } = await params

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, introduction, role, interests, is_public"
      )
      .eq("id", userId)
      .eq("is_public", true)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      profile,
    })
  } catch (error) {
    console.error("Public profile error:", error)

    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    )
  }
}