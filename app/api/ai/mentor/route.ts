import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 60

type StoredMessage = {
  role: "user" | "assistant"
  content: string
}

type RequestBody = {
  message: string
  sessionId?: string | null
  image?: {
    data: string
    mimeType: string
  }
}

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

    const sessionId = request.nextUrl.searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      )
    }

    // Verify that the session belongs to this user.
    const { data: session, error: sessionError } = await supabase
      .from("mentor_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    const { data: messages, error } = await supabase
      .from("mentor_messages")
      .select("id, role, content, created_at")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Failed to load mentor history:", error)

      return NextResponse.json(
        { error: "Failed to load mentor history" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      messages: messages ?? [],
    })
  } catch (error) {
    console.error("AI Mentor GET error:", error)

    return NextResponse.json(
      { error: "Failed to load mentor history" },
      { status: 500 }
    )
  }
}

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

    const body = (await request.json()) as RequestBody

    const message = body.message?.trim()
    const sessionId = body.sessionId
    const image = body.image

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      )
    }

    /*
     * If there is no session ID, create a new conversation.
     * This is important for the first message of a new chat.
     */
    let activeSessionId = sessionId ?? null

    if (!activeSessionId) {
      const title =
        message.length > 60
          ? `${message.slice(0, 60)}...`
          : message

      const { data: newSession, error: createSessionError } =
        await supabase
          .from("mentor_sessions")
          .insert({
            user_id: user.id,
            title,
          })
          .select("id, title, created_at, updated_at")
          .single()

      if (createSessionError || !newSession) {
        console.error(
          "Failed to create mentor session:",
          createSessionError
        )

        return NextResponse.json(
          { error: "Failed to create a new conversation" },
          { status: 500 }
        )
      }

      activeSessionId = newSession.id
    } else {
      /*
       * Verify that the supplied session belongs to this user.
       */
      const { data: session, error: sessionError } = await supabase
        .from("mentor_sessions")
        .select("id")
        .eq("id", activeSessionId)
        .eq("user_id", user.id)
        .single()

      if (sessionError || !session) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        )
      }
    }

    /*
     * Load previous messages from this conversation.
     */
    const { data: previousMessages, error: historyError } =
      await supabase
        .from("mentor_messages")
        .select("role, content")
        .eq("session_id", activeSessionId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(16)

    if (historyError) {
      console.error(
        "Failed to load AI context:",
        historyError
      )
    }

    const history: StoredMessage[] = (
      previousMessages ?? []
    ).reverse()

    const conversationHistory = history
      .map((item) => {
        const speaker =
          item.role === "user" ? "Student" : "Mentor"

        return `${speaker}: ${item.content}`
      })
      .join("\n\n")

    const systemPrompt = `
You are the FolioLabs AI Mentor, a patient and highly capable Socratic learning mentor.

Your job is to help students THINK and learn, not simply complete their work for them.

CORE BEHAVIOUR:
- Guide the student toward the answer using reasoning, questions, hints, examples, and conceptual explanations.
- Explain concepts clearly when the student asks for an explanation.
- If a student asks for an example, give an example that teaches the method without simply completing the student's exact problem for them.
- Break difficult problems into manageable steps.
- Ask useful follow-up questions when appropriate.
- Respond naturally and completely.
- Do NOT intentionally cut sentences short.
- Do NOT artificially limit yourself to one or two sentences.
- A response can be several sentences when explanation is genuinely useful.
- Avoid unnecessarily long lectures.
- Be clear, focused, and helpful.

ANSWER POLICY:
- Do not immediately reveal the final answer to a problem.
- Guide the student toward it.
- If the student has already demonstrated essentially all of the required reasoning, you may confirm their conclusion.
- If the student asks for the answer repeatedly, continue providing useful guidance rather than becoming repetitive.
- Never repeatedly say "I won't give you the answer."
- Sound like a real mentor.

MATH FORMATTING:
- Use standard LaTeX for mathematical notation.
- Inline mathematics MUST use $...$.
- Standalone equations MUST use $$...$$.
- Never use [ ... ] as a substitute for display math.
- Never use plain parentheses as a substitute for math delimiters.
- Never output raw LaTeX commands outside math delimiters.
- Preserve mathematical structure correctly.

IMAGE POLICY:
- If the student uploads an image, carefully inspect visible text, equations, diagrams, graphs, or handwritten work.
- Help the student understand what is shown.
- Do not invent information that is not visible.

Your goal is to make the student think, understand, and eventually solve the problem themselves.
`

    const prompt = `
${systemPrompt}

CURRENT CONVERSATION:

${conversationHistory || "This is the beginning of a new conversation."}

Student's new message:

${message}
`

    const parts: Array<
      | { text: string }
      | {
          inlineData: {
            mimeType: string
            data: string
          }
        }
    > = [
      {
        text: prompt,
      },
    ]

    if (image?.data && image?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      })
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    })

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      config: {
        temperature: 0.5,
        maxOutputTokens: 1000,
      },
    })

    const response = result.text?.trim()

    if (!response) {
      return NextResponse.json(
        { error: "The AI returned an empty response" },
        { status: 502 }
      )
    }

    /*
     * Save student message.
     */
    const { error: saveUserError } = await supabase
      .from("mentor_messages")
      .insert({
        user_id: user.id,
        session_id: activeSessionId,
        role: "user",
        content: message,
      })

    if (saveUserError) {
      console.error(
        "Failed to save user message:",
        saveUserError
      )
    }

    /*
     * Save mentor response.
     */
    const { error: saveAssistantError } = await supabase
      .from("mentor_messages")
      .insert({
        user_id: user.id,
        session_id: activeSessionId,
        role: "assistant",
        content: response,
      })

    if (saveAssistantError) {
      console.error(
        "Failed to save assistant message:",
        saveAssistantError
      )
    }

    /*
     * Update conversation timestamp.
     */
    await supabase
      .from("mentor_sessions")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeSessionId)
      .eq("user_id", user.id)

    return NextResponse.json({
      response,
      sessionId: activeSessionId,
    })
  } catch (error) {
    console.error("AI Mentor error:", error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI Mentor request failed",
      },
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

    const sessionId =
      request.nextUrl.searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("mentor_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", user.id)

    if (error) {
      console.error(
        "Failed to delete mentor session:",
        error
      )

      return NextResponse.json(
        { error: "Failed to delete conversation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Sessions DELETE error:", error)

    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    )
  }
}