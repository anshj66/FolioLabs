import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAIL = "anshj6627@gmail.com"
const FIELDS = ["title", "organization", "type", "category", "short_description", "description", "eligibility", "location", "mode", "start_date", "deadline", "prize_details", "benefits", "application_url", "source_url", "tags", "status"] as const

async function session() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null, isAdmin: false }
  return { supabase, user, isAdmin: user.email?.toLowerCase() === ADMIN_EMAIL }
}

function cleanBody(body: Record<string, unknown>, partial = false) {
  const result: Record<string, unknown> = {}
  for (const key of FIELDS) {
    if (!(key in body) && partial) continue
    const value = body[key]
    if (key === "tags" || key === "benefits") {
      result[key] = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string").map(v => v.trim()).filter(Boolean).slice(0, 20) : []
    } else if (key === "status") {
      result[key] = value === "published" ? "published" : "draft"
    } else if ((key === "start_date" || key === "deadline") && value === "") {
      result[key] = null
    } else if (typeof value === "string") {
      result[key] = value.trim()
    } else if (!partial) {
      result[key] = ""
    }
  }
  return result
}

function validate(data: Record<string, unknown>) {
  if (typeof data.title !== "string" || data.title.length < 3 || data.title.length > 160) return "Title must be between 3 and 160 characters."
  if (typeof data.organization !== "string" || !data.organization) return "Organization is required."
  if (typeof data.description !== "string" || data.description.length < 20) return "Add a description of at least 20 characters."
  if (typeof data.application_url !== "string" || !/^https?:\/\//i.test(data.application_url)) return "Enter a valid application URL starting with https:// or http://."
  if (data.source_url && typeof data.source_url === "string" && !/^https?:\/\//i.test(data.source_url)) return "Source URL must start with https:// or http://."
  return null
}

export async function GET() {
  try {
    const { supabase, user, isAdmin } = await session()
    if (!user) return NextResponse.json({ error: "Please sign in to view opportunities." }, { status: 401 })
    let query = supabase.from("opportunities").select("*").order("created_at", { ascending: false })
    if (!isAdmin) query = query.eq("status", "published")
    const { data, error } = await query
    if (error) {
      console.error("Opportunities GET:", error)
      return NextResponse.json({ error: "Could not load opportunities. Check that the opportunities SQL migration has been run." }, { status: 500 })
    }
    return NextResponse.json({ opportunities: data ?? [], isAdmin })
  } catch (error) {
    console.error("Opportunities GET error:", error)
    return NextResponse.json({ error: "Could not load opportunities." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, isAdmin } = await session()
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
    if (!isAdmin) return NextResponse.json({ error: "Only the FolioLabs admin can post opportunities." }, { status: 403 })
    const body = await request.json()
    const data = cleanBody(body)
    const problem = validate(data)
    if (problem) return NextResponse.json({ error: problem }, { status: 400 })
    const { data: created, error } = await supabase.from("opportunities").insert({ ...data, created_by: user.id, updated_at: new Date().toISOString() }).select("*").single()
    if (error) {
      console.error("Opportunities POST:", error)
      return NextResponse.json({ error: "Could not save opportunity." }, { status: 500 })
    }
    return NextResponse.json({ opportunity: created }, { status: 201 })
  } catch (error) {
    console.error("Opportunities POST error:", error)
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user, isAdmin } = await session()
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
    if (!isAdmin) return NextResponse.json({ error: "Only the FolioLabs admin can edit opportunities." }, { status: 403 })
    const body = await request.json()
    if (typeof body.id !== "string" || !body.id) return NextResponse.json({ error: "Opportunity ID is required." }, { status: 400 })
    const data = cleanBody(body, true)
    const problem = validate({ ...data, ...(data.title === undefined ? { title: "valid" } : {}), ...(data.organization === undefined ? { organization: "valid" } : {}), ...(data.description === undefined ? { description: "This field is unchanged and already validated." } : {}), ...(data.application_url === undefined ? { application_url: "https://example.com" } : {}) })
    if (problem) return NextResponse.json({ error: problem }, { status: 400 })
    const { data: updated, error } = await supabase.from("opportunities").update({ ...data, updated_at: new Date().toISOString() }).eq("id", body.id).select("*").single()
    if (error) {
      console.error("Opportunities PATCH:", error)
      return NextResponse.json({ error: "Could not update opportunity." }, { status: 500 })
    }
    return NextResponse.json({ opportunity: updated })
  } catch (error) {
    console.error("Opportunities PATCH error:", error)
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user, isAdmin } = await session()
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
    if (!isAdmin) return NextResponse.json({ error: "Only the FolioLabs admin can delete opportunities." }, { status: 403 })
    const id = request.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Opportunity ID is required." }, { status: 400 })
    const { error } = await supabase.from("opportunities").delete().eq("id", id)
    if (error) {
      console.error("Opportunities DELETE:", error)
      return NextResponse.json({ error: "Could not delete opportunity." }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Opportunities DELETE error:", error)
    return NextResponse.json({ error: "Could not delete opportunity." }, { status: 500 })
  }
}
