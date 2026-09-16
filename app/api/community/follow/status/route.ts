import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const idsParam =
      request.nextUrl.searchParams.get("ids")

    if (!idsParam) {
      return NextResponse.json({
        following: {},
      })
    }

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)

    const { data, error } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .in("following_id", ids)

    if (error) {
      console.error(
        "Follow status error:",
        error
      )

      return NextResponse.json(
        { error: "Failed to load follow status" },
        { status: 500 }
      )
    }

    const following: Record<string, boolean> = {}

    for (const id of ids) {
      following[id] = false
    }

    for (const row of data ?? []) {
      following[row.following_id] = true
    }

    return NextResponse.json({
      following,
    })
  } catch (error) {
    console.error(
      "Follow status route error:",
      error
    )

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}