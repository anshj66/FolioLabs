"use client"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient()
    const { userId } = await params

    const {
      count: followers,
      error: followersError,
    } = await supabase
      .from("follows")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("following_id", userId)

    if (followersError) {
      throw followersError
    }

    const {
      count: following,
      error: followingError,
    } = await supabase
      .from("follows")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("follower_id", userId)

    if (followingError) {
      throw followingError
    }

    return NextResponse.json({
      followers: followers ?? 0,
      following: following ?? 0,
    })
  } catch (error) {
    console.error("Community stats error:", error)

    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 }
    )
  }
}