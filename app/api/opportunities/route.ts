import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

const ADMIN_EMAIL = "anshj6627@gmail.com"
const FIELDS = ["title", "organization", "type", "category", "short_description", "description", "eligibility", "location", "mode", "start_date", "deadline", "prize_details", "benefits", "application_url", "source_url", "tags", "status"] as const

async function session() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null, isAdmin: false, isProfessor: false }
  const { data: profile } = await supabase.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  return { supabase, user, isAdmin: user.email?.toLowerCase() === ADMIN_EMAIL, isProfessor: profile?.academic_role === "professor" && profile?.verification_status === "approved", isApproved: profile?.verification_status === "approved" }
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
    const { user, isAdmin, isProfessor, isApproved } = await session()
    if (!user) return NextResponse.json({ error: "Please sign in to view opportunities." }, { status: 401 })
    if (!isAdmin && !isApproved) return NextResponse.json({ error: "Your academic role must be approved before viewing opportunities." }, { status: 403 })
    const service = createServiceClient()
    const { data, error } = await service.from("opportunities").select("*").order("created_at", { ascending: false })
    if (error) {
      console.error("Opportunities GET:", error)
      return NextResponse.json({ error: "Could not load opportunities. Check that the opportunities SQL migration has been run." }, { status: 500 })
    }
    const visible = (data ?? []).filter(item => isAdmin || item.status === "published" || (isProfessor && item.created_by === user.id))
    return NextResponse.json({ opportunities: visible.map(item => ({ ...item, can_edit: isAdmin || (isProfessor && item.created_by === user.id) })), isAdmin, canPost: isAdmin || isProfessor })
  } catch (error) {
    console.error("Opportunities GET error:", error)
    return NextResponse.json({ error: "Could not load opportunities." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, isAdmin, isProfessor } = await session()
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
    if (!isAdmin && !isProfessor) return NextResponse.json({ error: "Only the administrator or an approved professor can post opportunities." }, { status: 403 })
    const body = await request.json()
    const data = cleanBody(body)
    const problem = validate(data)
    if (problem) return NextResponse.json({ error: problem }, { status: 400 })
    const service = createServiceClient()
    const { data: created, error } = await service.from("opportunities").insert({ ...data, created_by: user.id, updated_at: new Date().toISOString() }).select("*").single()
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
    const { user, isAdmin, isProfessor } = await session()
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
    if (!isAdmin && !isProfessor) return NextResponse.json({ error: "Only the administrator or an approved professor can edit opportunities." }, { status: 403 })
    const body = await request.json()
    if (typeof body.id !== "string" || !body.id) return NextResponse.json({ error: "Opportunity ID is required." }, { status: 400 })
    const service = createServiceClient()
    const { data: existing } = await service.from("opportunities").select("id,created_by").eq("id", body.id).maybeSingle()
    if (!existing) return NextResponse.json({ error: "Opportunity not found." }, { status: 404 })
    if (!isAdmin && existing.created_by !== user.id) return NextResponse.json({ error: "Professors can only edit opportunities they created." }, { status: 403 })
    const data = cleanBody(body, true)
    const problem = validate({ ...data, ...(data.title === undefined ? { title: "valid" } : {}), ...(data.organization === undefined ? { organization: "valid" } : {}), ...(data.description === undefined ? { description: "This field is unchanged and already validated." } : {}), ...(data.application_url === undefined ? { application_url: "https://example.com" } : {}) })
    if (problem) return NextResponse.json({ error: problem }, { status: 400 })
    const { data: updated, error } = await service.from("opportunities").update({ ...data, updated_at: new Date().toISOString() }).eq("id", body.id).select("*").single()
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
    const { user, isAdmin, isProfessor } = await session()
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
    if (!isAdmin && !isProfessor) return NextResponse.json({ error: "Only the administrator or an approved professor can delete opportunities." }, { status: 403 })
    const id = request.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Opportunity ID is required." }, { status: 400 })
    const service = createServiceClient()
    const { data: existing } = await service.from("opportunities").select("id,created_by").eq("id", id).maybeSingle()
    if (!existing) return NextResponse.json({ error: "Opportunity not found." }, { status: 404 })
    if (!isAdmin && existing.created_by !== user.id) return NextResponse.json({ error: "Professors can only delete opportunities they created." }, { status: 403 })
    const { error } = await service.from("opportunities").delete().eq("id", id)
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
