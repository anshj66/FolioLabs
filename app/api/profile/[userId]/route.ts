import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient()
    const { userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, introduction, role, interests, is_public"
      )
      .eq("id", userId)
      .eq("is_public", true)
      .maybeSingle()

    if (error) {
      console.error("Profile API error:", error)

      return NextResponse.json(
        { error: "Failed to load profile" },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found or is private" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      profile,
    })
  } catch (error) {
    console.error("Profile route error:", error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}