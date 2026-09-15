import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: sessions, error } = await supabase
      .from("mentor_sessions")
      .select("id, title, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Failed to load sessions:", error)

      return NextResponse.json(
        { error: "Failed to load conversations" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sessions: sessions ?? [],
    })
  } catch (error) {
    console.error("Sessions GET error:", error)

    return NextResponse.json(
      { error: "Failed to load conversations" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "New conversation"

    const { data: session, error } = await supabase
      .from("mentor_sessions")
      .insert({
        user_id: user.id,
        title,
      })
      .select("id, title, created_at, updated_at")
      .single()

    if (error) {
      console.error("Failed to create session:", error)

      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      session,
    })
  } catch (error) {
    console.error("Sessions POST error:", error)

    return NextResponse.json(
      { error: "Failed to create conversation" },
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

    const sessionId = request.nextUrl.searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      )
    }

    const { data: session, error: findError } = await supabase
      .from("mentor_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (findError || !session) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    const { error: deleteError } = await supabase
      .from("mentor_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("Failed to delete session:", deleteError)

      return NextResponse.json(
        { error: "Failed to delete conversation" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error("Sessions DELETE error:", error)

    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    )
  }
}