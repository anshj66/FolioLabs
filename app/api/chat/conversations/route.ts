import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function sortUsers(a: string, b: string) {
  return a < b ? [a, b] : [b, a]
}

export async function GET() {
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

    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(
        `
        id,
        user_one_id,
        user_two_id,
        created_at,
        updated_at
        `
      )
      .or(
        `user_one_id.eq.${user.id},user_two_id.eq.${user.id}`
      )
      .order("updated_at", {
        ascending: false,
      })

    if (error) {
      console.error(
        "Conversations GET error:",
        error
      )

      return NextResponse.json(
        { error: "Failed to load conversations" },
        { status: 500 }
      )
    }

    const otherIds =
      conversations?.map((conversation) =>
        conversation.user_one_id === user.id
          ? conversation.user_two_id
          : conversation.user_one_id
      ) ?? []

    const uniqueIds = Array.from(
      new Set(otherIds)
    )

    let profiles: {
      id: string
      full_name: string | null
      role: string
    }[] = []

    if (uniqueIds.length > 0) {
      const { data, error: profilesError } =
        await supabase
          .from("profiles")
          .select("id, full_name, role")
          .in("id", uniqueIds)

      if (profilesError) {
        console.error(
          "Conversation profiles error:",
          profilesError
        )

        return NextResponse.json(
          { error: "Failed to load conversation users" },
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

    const result =
      conversations?.map((conversation) => {
        const otherUserId =
          conversation.user_one_id === user.id
            ? conversation.user_two_id
            : conversation.user_one_id

        return {
          ...conversation,
          otherUserId,
          otherUser:
            profileMap.get(otherUserId) ?? null,
        }
      }) ?? []

    return NextResponse.json({
      conversations: result,
    })
  } catch (error) {
    console.error(
      "Conversations GET error:",
      error
    )

    return NextResponse.json(
      { error: "Failed to load conversations" },
      { status: 500 }
    )
  }
}


export async function POST(
  request: NextRequest
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

    const body = await request.json()

    const otherUserId = body.userId

    if (
      typeof otherUserId !== "string" ||
      !otherUserId
    ) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    if (otherUserId === user.id) {
      return NextResponse.json(
        { error: "You cannot message yourself" },
        { status: 400 }
      )
    }

    /*
     * Only allow messaging between users
     * who have a follow relationship.
     *
     * Either direction counts.
     */

    const { data: relationship } = await supabase
      .from("follows")
      .select("follower_id, following_id")
      .or(
        `and(follower_id.eq.${user.id},following_id.eq.${otherUserId}),and(follower_id.eq.${otherUserId},following_id.eq.${user.id})`
      )
      .limit(1)
      .maybeSingle()

    if (!relationship) {
      return NextResponse.json(
        {
          error:
            "You can message someone after a follow connection exists.",
        },
        { status: 403 }
      )
    }

    const [userOneId, userTwoId] = sortUsers(
      user.id,
      otherUserId
    )

    const { data: conversation, error } =
      await supabase
        .from("conversations")
        .upsert(
          {
            user_one_id: userOneId,
            user_two_id: userTwoId,
          },
          {
            onConflict:
              "user_one_id,user_two_id",
          }
        )
        .select(
          "id, user_one_id, user_two_id, created_at, updated_at"
        )
        .single()

    if (error) {
      console.error(
        "Conversation create error:",
        error
      )

      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      conversation,
    })
  } catch (error) {
    console.error(
      "Conversation POST error:",
      error
    )

    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    )
  }
}