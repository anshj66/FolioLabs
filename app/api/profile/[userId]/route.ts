import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ userId: string }>
  }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    /*
     * Users can always view their own profile.
     * Other users can only view public profiles.
     */
    let query = supabase
      .from("profiles")
      .select(
        "id, full_name, introduction, role, interests, is_public"
      )
      .eq("id", userId)

    if (!user || user.id !== userId) {
      query = query.eq("is_public", true)
    }

    const { data: profile, error } =
      await query.maybeSingle()

    if (error) {
      console.error(
        "Profile API error:",
        error
      )

      return NextResponse.json(
        { error: "Failed to load profile" },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Profile not found or is private",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      profile,
      isOwnProfile: user?.id === userId,
    })
  } catch (error) {
    console.error(
      "Profile route error:",
      error
    )

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}