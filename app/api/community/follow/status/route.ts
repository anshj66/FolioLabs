import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
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

    const ids =
      request.nextUrl.searchParams
        .get("ids")
        ?.split(",")
        .map((id) => id.trim())
        .filter(Boolean) ?? []

    if (ids.length === 0) {
      return NextResponse.json({
        following: {},
      })
    }

    const { data, error } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .in("following_id", ids)

    if (error) {
      console.error("Follow status error:", error)

      return NextResponse.json(
        { error: "Failed to load follow status" },
        { status: 500 }
      )
    }

    const following: Record<string, boolean> = {}

    ids.forEach((id) => {
      following[id] = false
    })

    data?.forEach((row) => {
      following[row.following_id] = true
    })

    return NextResponse.json({
      following,
    })
  } catch (error) {
    console.error("Follow status GET error:", error)

    return NextResponse.json(
      { error: "Failed to load follow status" },
      { status: 500 }
    )
  }
}