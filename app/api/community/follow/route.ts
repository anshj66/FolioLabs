import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
const followingId = body.userId || body.following_id
    if (
      typeof followingId !== "string" ||
      !followingId
    ) {
      return NextResponse.json(
        { error: "following_id is required" },
        { status: 400 }
      )
    }

    if (followingId === user.id) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      )
    }

    const { data: targetProfile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, is_public")
        .eq("id", followingId)
        .single()

    if (
      profileError ||
      !targetProfile ||
      !targetProfile.is_public
    ) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from("follows")
      .insert({
        follower_id: user.id,
        following_id: followingId,
      })

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Already following" },
          { status: 409 }
        )
      }

      console.error("Follow error:", error)

      return NextResponse.json(
        { error: "Failed to follow user" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      following: true,
    })
  } catch (error) {
    console.error("Follow POST error:", error)

    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const followingId =
      request.nextUrl.searchParams.get("followingId")

    if (!followingId) {
      return NextResponse.json(
        { error: "followingId is required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId)

    if (error) {
      console.error("Unfollow error:", error)

      return NextResponse.json(
        { error: "Failed to unfollow user" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      following: false,
    })
  } catch (error) {
    console.error("Follow DELETE error:", error)

    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    )
  }
}