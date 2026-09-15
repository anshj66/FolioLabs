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

    // Make sure the profile exists and is public
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, is_public")
        .eq("id", userId)
        .maybeSingle()

    if (profileError) {
      console.error("Profile lookup error:", profileError)

      return NextResponse.json(
        { error: "Failed to load profile" },
        { status: 500 }
      )
    }

    if (!profile || !profile.is_public) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      )
    }

    // Count followers
    const { count: followers, error: followersError } =
      await supabase
        .from("follows")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("following_id", userId)

    if (followersError) {
      console.error(
        "Followers count error:",
        followersError
      )

      return NextResponse.json(
        { error: "Failed to count followers" },
        { status: 500 }
      )
    }

    // Count people this user follows
    const { count: following, error: followingError } =
      await supabase
        .from("follows")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("follower_id", userId)

    if (followingError) {
      console.error(
        "Following count error:",
        followingError
      )

      return NextResponse.json(
        { error: "Failed to count following" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      followers: followers ?? 0,
      following: following ?? 0,
    })
  } catch (error) {
    console.error("Stats route error:", error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}