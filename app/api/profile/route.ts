import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ALLOWED_ROLES = [
  "Student",
  "Researcher",
  "Teaching Assistant",
  "Professor",
  "Faculty",
  "Mentor",
  "Other",
]

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

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, introduction, role, interests, is_public"
      )
      .eq("id", user.id)
      .maybeSingle()

    if (error) {
      console.error("Profile GET error:", error)

      return NextResponse.json(
        { error: "Failed to load profile" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      profile: profile ?? {
        id: user.id,
        full_name:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          "",
        introduction: "",
        role: "Student",
        interests: [],
        is_public: false,
      },
    })
  } catch (error) {
    console.error("Profile GET error:", error)

    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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

    const fullName =
      typeof body.full_name === "string"
        ? body.full_name.trim()
        : ""

    const introduction =
      typeof body.introduction === "string"
        ? body.introduction.trim()
        : ""

    const role =
      typeof body.role === "string"
        ? body.role
        : "Student"

    const interests = Array.isArray(body.interests)
      ? body.interests
          .filter((item: unknown) => typeof item === "string")
          .map((item: string) => item.trim())
          .filter(Boolean)
          .slice(0, 10)
      : []

    const isPublic = body.is_public === true

    if (fullName.length > 100) {
      return NextResponse.json(
        { error: "Name must be 100 characters or less." },
        { status: 400 }
      )
    }

    if (introduction.length > 500) {
      return NextResponse.json(
        { error: "Introduction must be 500 characters or less." },
        { status: 400 }
      )
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role." },
        { status: 400 }
      )
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: fullName,
          introduction,
          role,
          interests,
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      )
      .select(
        "id, full_name, introduction, role, interests, is_public"
      )
      .single()

    if (error) {
      console.error("Profile PATCH error:", error)

      return NextResponse.json(
        { error: "Failed to save profile." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      profile,
    })
  } catch (error) {
    console.error("Profile PATCH error:", error)

    return NextResponse.json(
      { error: "Failed to save profile." },
      { status: 500 }
    )
  }
}