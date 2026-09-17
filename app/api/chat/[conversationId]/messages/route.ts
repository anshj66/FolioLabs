import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const CHAT_BUCKET = "chat-images"
const MAX_IMAGE_SIZE = 8 * 1024 * 1024

function isParticipant(conversation: any, userId: string) {
  return (
    conversation.user_one_id === userId ||
    conversation.user_two_id === userId
  )
}

async function getConversation(
  supabase: any,
  conversationId: string
) {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, user_one_id, user_two_id, user_one_cleared_at, user_two_cleared_at"
    )
    .eq("id", conversationId)
    .maybeSingle()

  return { data, error }
}

async function signImageUrls(
  supabase: any,
  messages: any[]
) {
  return Promise.all(
    messages.map(async (item) => {
      if (!item.image_path) return item

      const { data } = await supabase.storage
        .from(CHAT_BUCKET)
        .createSignedUrl(
          item.image_path,
          60 * 60 * 24
        )

      return {
        ...item,
        image_url: data?.signedUrl ?? null,
      }
    })
  )
}


/* =========================================================
   GET MESSAGES
   ========================================================= */

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      conversationId: string
    }>
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

    const { conversationId } = await params

    const {
      data: conversation,
      error: conversationError,
    } = await getConversation(
      supabase,
      conversationId
    )

    if (
      conversationError ||
      !conversation
    ) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    if (
      !isParticipant(
        conversation,
        user.id
      )
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    /*
     * Determine this user's personal
     * "Clear Chat" timestamp.
     */
    const clearedAt =
      conversation.user_one_id === user.id
        ? conversation.user_one_cleared_at
        : conversation.user_two_cleared_at

    /*
     * Mark incoming messages as read.
     */
    const { error: readError } =
      await supabase
        .from("messages")
        .update({
          read_at: new Date().toISOString(),
        })
        .eq(
          "conversation_id",
          conversationId
        )
        .neq(
          "sender_id",
          user.id
        )
        .is(
          "read_at",
          null
        )

    if (readError) {
      console.error(
        "Mark messages as read error:",
        readError
      )
    }

    /*
     * Load messages.
     *
     * If this user has cleared the chat,
     * only messages created AFTER the
     * clear timestamp are returned.
     */
    let messagesQuery = supabase
      .from("messages")
      .select(
        `
        id,
        conversation_id,
        sender_id,
        body,
        created_at,
        read_at,
        message_type,
        image_path
        `
      )
      .eq(
        "conversation_id",
        conversationId
      )

    if (clearedAt) {
      messagesQuery =
        messagesQuery.gt(
          "created_at",
          clearedAt
        )
    }

    const {
      data: messages,
      error,
    } = await messagesQuery.order(
      "created_at",
      {
        ascending: true,
      }
    )

    if (error) {
      console.error(
        "Messages GET error:",
        error
      )

      return NextResponse.json(
        {
          error:
            "Failed to load messages",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      messages:
        await signImageUrls(
          supabase,
          messages ?? []
        ),
    })
  } catch (error) {
    console.error(
      "Messages GET error:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Failed to load messages",
      },
      { status: 500 }
    )
  }
}


/* =========================================================
   POST MESSAGE
   ========================================================= */

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      conversationId: string
    }>
  }
) {
  let uploadedImagePath: string | null =
    null

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

    const { conversationId } =
      await params

    const {
      data: conversation,
      error: conversationError,
    } =
      await getConversation(
        supabase,
        conversationId
      )

    if (
      conversationError ||
      !conversation
    ) {
      return NextResponse.json(
        {
          error:
            "Conversation not found",
        },
        { status: 404 }
      )
    }

    if (
      !isParticipant(
        conversation,
        user.id
      )
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    let message = ""
    let imagePath: string | null =
      null

    let messageType:
      | "text"
      | "image"
      | "mixed" = "text"

    const contentType =
      request.headers.get(
        "content-type"
      ) ?? ""

    /*
     * IMAGE / FORM DATA
     */
    if (
      contentType.includes(
        "multipart/form-data"
      )
    ) {
      const formData =
        await request.formData()

      message =
        typeof formData.get(
          "body"
        ) === "string"
          ? String(
              formData.get("body")
            ).trim()
          : ""

      const file =
        formData.get("image")

      if (
        file instanceof File &&
        file.size > 0
      ) {
        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          return NextResponse.json(
            {
              error:
                "Only image files are allowed",
            },
            { status: 400 }
          )
        }

        if (
          file.size >
          MAX_IMAGE_SIZE
        ) {
          return NextResponse.json(
            {
              error:
                "Image must be 8 MB or smaller",
            },
            { status: 400 }
          )
        }

        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
          "jpg"

        const safeExtension =
          extension.replace(
            /[^a-z0-9]/g,
            ""
          ) || "jpg"

        imagePath = `${user.id}/${conversationId}/${crypto.randomUUID()}.${safeExtension}`

        uploadedImagePath =
          imagePath

        const {
          error: uploadError,
        } = await supabase.storage
          .from(CHAT_BUCKET)
          .upload(
            imagePath,
            file,
            {
              contentType:
                file.type,
              upsert: false,
            }
          )

        if (uploadError) {
          console.error(
            "Chat image upload error:",
            uploadError
          )

          return NextResponse.json(
            {
              error:
                "Failed to upload image",
            },
            { status: 500 }
          )
        }
      }
    } else {
      /*
       * NORMAL TEXT MESSAGE
       */
      const body =
        await request.json()

      message =
        typeof body.body ===
        "string"
          ? body.body.trim()
          : ""
    }

    if (
      message.length >
      5000
    ) {
      return NextResponse.json(
        {
          error:
            "Message must be 5000 characters or less",
        },
        { status: 400 }
      )
    }

    if (
      imagePath &&
      message
    ) {
      messageType = "mixed"
    } else if (imagePath) {
      messageType = "image"
    }

    if (
      !message &&
      !imagePath
    ) {
      return NextResponse.json(
        {
          error:
            "Message cannot be empty",
        },
        { status: 400 }
      )
    }

    const {
      data: savedMessage,
      error,
    } = await supabase
      .from("messages")
      .insert({
        conversation_id:
          conversationId,
        sender_id: user.id,
        body: message,
        message_type:
          messageType,
        image_path:
          imagePath,
      })
      .select(
        `
        id,
        conversation_id,
        sender_id,
        body,
        created_at,
        read_at,
        message_type,
        image_path
        `
      )
      .single()

    if (error) {
      if (
        uploadedImagePath
      ) {
        await supabase.storage
          .from(CHAT_BUCKET)
          .remove([
            uploadedImagePath,
          ])
      }

      console.error(
        "Message POST error:",
        error
      )

      return NextResponse.json(
        {
          error:
            "Failed to send message",
        },
        { status: 500 }
      )
    }

    const [
      messageWithUrl,
    ] = await signImageUrls(
      supabase,
      [savedMessage]
    )

    return NextResponse.json({
      message:
        messageWithUrl,
    })
  } catch (error) {
    if (
      uploadedImagePath
    ) {
      try {
        const supabase =
          await createClient()

        await supabase.storage
          .from(CHAT_BUCKET)
          .remove([
            uploadedImagePath,
          ])
      } catch {
        // Ignore cleanup failure.
      }
    }

    console.error(
      "Message POST error:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Failed to send message",
      },
      { status: 500 }
    )
  }
}


/* =========================================================
   DELETE MESSAGE / CLEAR CHAT
   ========================================================= */

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      conversationId: string
    }>
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

    const { conversationId } =
      await params

    const {
      data: conversation,
      error: conversationError,
    } =
      await getConversation(
        supabase,
        conversationId
      )

    if (
      conversationError ||
      !conversation
    ) {
      return NextResponse.json(
        {
          error:
            "Conversation not found",
        },
        { status: 404 }
      )
    }

    if (
      !isParticipant(
        conversation,
        user.id
      )
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    let payload: {
      messageId?: string
      clearChat?: boolean
    } = {}

    try {
      payload =
        await request.json()
    } catch {
      payload = {}
    }


    /* =====================================================
       INDIVIDUAL MESSAGE DELETE

       This permanently deletes the message.

       Therefore:
       A deletes → A and B both lose it.
       ===================================================== */

    if (
      payload.messageId
    ) {
      const {
        data: target,
        error: targetError,
      } = await supabase
        .from("messages")
        .select(
          "id, sender_id, image_path"
        )
        .eq(
          "id",
          payload.messageId
        )
        .eq(
          "conversation_id",
          conversationId
        )
        .maybeSingle()

      if (
        targetError ||
        !target
      ) {
        return NextResponse.json(
          {
            error:
              "Message not found",
          },
          { status: 404 }
        )
      }

      /*
       * Only the sender can
       * individually delete it.
       */
      if (
        target.sender_id !==
        user.id
      ) {
        return NextResponse.json(
          {
            error:
              "You can only delete your own messages",
          },
          { status: 403 }
        )
      }

      const {
        error: deleteError,
      } = await supabase
        .from("messages")
        .delete()
        .eq(
          "id",
          target.id
        )
        .eq(
          "conversation_id",
          conversationId
        )
        .eq(
          "sender_id",
          user.id
        )

      if (deleteError) {
        console.error(
          "Delete message error:",
          deleteError
        )

        return NextResponse.json(
          {
            error:
              "Failed to delete message",
          },
          { status: 500 }
        )
      }

      /*
       * Delete the image belonging
       * to that message as well.
       */
      if (
        target.image_path
      ) {
        const {
          error:
            storageError,
        } =
          await supabase.storage
            .from(CHAT_BUCKET)
            .remove([
              target.image_path,
            ])

        if (storageError) {
          console.error(
            "Delete message image error:",
            storageError
          )
        }
      }

      return NextResponse.json({
        success: true,
        type: "message",
      })
    }


    /* =====================================================
       CLEAR CHAT

       IMPORTANT:
       DOES NOT DELETE DATABASE MESSAGES.

       It only records a timestamp for THIS USER.

       Other participant keeps seeing old messages.
       ===================================================== */

    if (
      payload.clearChat === true
    ) {
      const column =
        conversation.user_one_id ===
        user.id
          ? "user_one_cleared_at"
          : "user_two_cleared_at"

      const now =
        new Date().toISOString()

      const {
        error: clearError,
      } = await supabase
        .from("conversations")
        .update({
          [column]: now,
        })
        .eq(
          "id",
          conversationId
        )

      if (clearError) {
        console.error(
          "Clear chat error:",
          clearError
        )

        return NextResponse.json(
          {
            error:
              "Failed to clear chat",
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        type: "clear",
        clearedAt: now,
      })
    }


    /* =====================================================
       INVALID REQUEST
       ===================================================== */

    return NextResponse.json(
      {
        error:
          "messageId or clearChat is required",
      },
      { status: 400 }
    )
  } catch (error) {
    console.error(
      "Message DELETE error:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Failed to process request",
      },
      { status: 500 }
    )
  }
}