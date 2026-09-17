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
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const isOwnProfile = user.id === userId

    /*
     * Own followers/following are always visible.
     *
     * For someone else's profile, BOTH users must follow
     * each other before the lists can be viewed.
     */
    if (!isOwnProfile) {
      const { data: viewerFollowsTarget, error: firstError } =
        await supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("following_id", userId)
          .maybeSingle()

      if (firstError) {
        console.error(
          "Viewer follow check error:",
          firstError
        )

        return NextResponse.json(
          { error: "Failed to check connection" },
          { status: 500 }
        )
      }

      const { data: targetFollowsViewer, error: secondError } =
        await supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", userId)
          .eq("following_id", user.id)
          .maybeSingle()

      if (secondError) {
        console.error(
          "Mutual follow check error:",
          secondError
        )

        return NextResponse.json(
          { error: "Failed to check connection" },
          { status: 500 }
        )
      }

      const isMutual =
        !!viewerFollowsTarget &&
        !!targetFollowsViewer

      if (!isMutual) {
        return NextResponse.json(
          {
            error:
              "Followers and following are visible only to mutual connections.",
            canView: false,
          },
          { status: 403 }
        )
      }
    }

    /*
     * Load followers.
     */
    const { data: followerRows, error: followersError } =
      await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", userId)

    if (followersError) {
      console.error(
        "Followers error:",
        followersError
      )

      return NextResponse.json(
        { error: "Failed to load followers" },
        { status: 500 }
      )
    }

    /*
     * Load following.
     */
    const { data: followingRows, error: followingError } =
      await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId)

    if (followingError) {
      console.error(
        "Following error:",
        followingError
      )

      return NextResponse.json(
        { error: "Failed to load following" },
        { status: 500 }
      )
    }

    const followerIds =
      followerRows?.map((row) => row.follower_id) ?? []

    const followingIds =
      followingRows?.map((row) => row.following_id) ?? []

    const allIds = Array.from(
      new Set([
        ...followerIds,
        ...followingIds,
      ])
    )

    let profiles: {
      id: string
      full_name: string | null
      role: string
      interests: string[]
      is_public: boolean
    }[] = []

    if (allIds.length > 0) {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, role, interests, is_public"
        )
        .in("id", allIds)

      if (error) {
        console.error(
          "Connection profiles error:",
          error
        )

        return NextResponse.json(
          {
            error:
              "Failed to load connection profiles",
          },
          { status: 500 }
        )
      }

      profiles = data ?? []
    }

    const profileMap = new Map(
      profiles.map((profile) => [
        profile.id,
        profile,
      ])
    )

    const followers = followerIds
      .map((id) => profileMap.get(id))
      .filter(Boolean)

    const following = followingIds
      .map((id) => profileMap.get(id))
      .filter(Boolean)

    return NextResponse.json({
      canView: true,
      followers,
      following,
    })
  } catch (error) {
    console.error(
      "Connections route error:",
      error
    )

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}