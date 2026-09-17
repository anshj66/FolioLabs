import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    /*
     * Get all conversations where the current user
     * is a participant.
     */
    const { data: conversations, error } =
      await supabase
        .from("conversations")
        .select(
          "id, user_one_id, user_two_id"
        )
        .or(
          `user_one_id.eq.${user.id},user_two_id.eq.${user.id}`
        )

    if (error) {
      console.error(
        "Unread conversations error:",
        error
      )

      return NextResponse.json(
        {
          error:
            "Failed to load unread conversations",
        },
        { status: 500 }
      )
    }

    if (!conversations?.length) {
      return NextResponse.json({
        unreadCount: 0,
      })
    }

    const conversationIds =
      conversations.map(
        (conversation) =>
          conversation.id
      )

    /*
     * Find unread messages sent by someone else.
     */
    const { data: unreadMessages, error: unreadError } =
      await supabase
        .from("messages")
        .select(
          "conversation_id"
        )
        .in(
          "conversation_id",
          conversationIds
        )
        .neq("sender_id", user.id)
        .is("read_at", null)

    if (unreadError) {
      console.error(
        "Unread messages error:",
        unreadError
      )

      return NextResponse.json(
        {
          error:
            "Failed to calculate unread count",
        },
        { status: 500 }
      )
    }

    /*
     * IMPORTANT:
     * Count UNIQUE conversations, not messages.
     *
     * So:
     *
     * A sends 3 messages = 1
     * B sends 2 messages = 1
     *
     * Total = 2
     */
    const unreadConversationIds =
      new Set(
        unreadMessages?.map(
          (message) =>
            message.conversation_id
        ) ?? []
      )

    return NextResponse.json({
      unreadCount:
        unreadConversationIds.size,
    })
  } catch (error) {
    console.error(
      "Unread API error:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Failed to calculate unread count",
      },
      { status: 500 }
    )
  }
}