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

    const searchParams = request.nextUrl.searchParams

    const search = searchParams.get("search")?.trim() || ""
    const role = searchParams.get("role")?.trim() || ""
    const interest = searchParams.get("interest")?.trim() || ""

    let query = supabase
      .from("profiles")
      .select("id, full_name, role, interests")
      .eq("is_public", true)
      .neq("id", user.id)
      .order("full_name", { ascending: true })

    if (search) {
      query = query.ilike("full_name", `%${search}%`)
    }

    if (role) {
      query = query.eq("role", role)
    }

    if (interest) {
      query = query.contains("interests", [interest])
    }

    const { data: profiles, error } = await query

    if (error) {
      console.error("Community profiles error:", error)

      return NextResponse.json(
        { error: "Failed to load community" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      profiles: profiles ?? [],
    })
  } catch (error) {
    console.error("Community GET error:", error)

    return NextResponse.json(
      { error: "Failed to load community" },
      { status: 500 }
    )
  }
}