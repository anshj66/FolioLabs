import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"
import { isApprovedAcademic } from "@/lib/platform/permissions"

export const runtime = "nodejs"

const DEFAULT_SECTIONS = [
  { key: "introduction", title: "Introduction", description: "Set the context, explain the problem, and establish why it matters.", content: "", status: "ready" },
  { key: "research_question", title: "Research question & objectives", description: "Define what you want to find out and what success would mean.", content: "", status: "ready" },
  { key: "literature_review", title: "Literature review", description: "Map what is known, compare credible sources, and identify what remains uncertain.", content: "", status: "ready" },
  { key: "hypothesis", title: "Hypothesis / proposition", description: "State a testable expectation or a guiding proposition, where appropriate.", content: "", status: "ready" },
  { key: "methodology", title: "Methodology", description: "Explain how you will investigate the question and why this method fits.", content: "", status: "ready" },
  { key: "results", title: "Results & analysis", description: "Record real observations, data, calculations, or analytical findings.", content: "", status: "ready" },
  { key: "discussion", title: "Discussion", description: "Interpret findings, compare them with prior work, and consider alternatives.", content: "", status: "ready" },
  { key: "conclusion", title: "Conclusion & future work", description: "Answer the question based on evidence, acknowledge limits, and identify next steps.", content: "", status: "ready" },
  { key: "references", title: "References", description: "Record the sources you actually consulted and cite them consistently.", content: "", status: "ready" },
]

function defaultData() {
  return {
    version: 1,
    researchType: "computational",
    structureMode: "guided",
    idea: "",
    introduction: "",
    hypothesis: "",
    courseDescription: "",
    sections: DEFAULT_SECTIONS.map((section) => ({ ...section })),
    createdFrom: "researchfolio",
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Please sign in to access your research projects." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Administrator accounts do not access student research workspaces." }, { status: 403 })
  const { data: profile } = await supabase.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile)) return NextResponse.json({ error: "Your academic role must be approved before accessing ResearchFolio." }, { status: 403 })

  const projectId = request.nextUrl.searchParams.get("id")
  if (projectId) {
    const { data: project, error } = await supabase.from("researchfolio_projects").select("*").eq("id", projectId).eq("user_id", user.id).maybeSingle()
    if (error) {
      console.error("ResearchFolio project load failed:", error)
      return NextResponse.json({ error: "Could not load this project. Apply the ResearchFolio database migration and try again." }, { status: 500 })
    }
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 })
    return NextResponse.json({ project })
  }

  const { data: projects, error } = await supabase.from("researchfolio_projects").select("id,title,project_type,topic,course_title,current_stage,project_data,updated_at,created_at").eq("user_id", user.id).order("updated_at", { ascending: false })
  if (error) {
    console.error("ResearchFolio project list failed:", error)
    return NextResponse.json({ error: "Could not load research projects. Apply the ResearchFolio database migration." }, { status: 500 })
  }
  return NextResponse.json({ projects: projects ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Please sign in to save a research project." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Administrator accounts do not access student research workspaces." }, { status: 403 })
  const { data: profile } = await supabase.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile)) return NextResponse.json({ error: "Your academic role must be approved before accessing ResearchFolio." }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }) }
  const action = typeof body.action === "string" ? body.action : "save"

  if (action === "create") {
    const projectType = body.project_type === "course" ? "course" : "independent"
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 180) : "Untitled research project"
    const projectData = defaultData()
    const { data: project, error } = await supabase.from("researchfolio_projects").insert({
      user_id: user.id,
      title: title || "Untitled research project",
      project_type: projectType,
      current_stage: "Project setup",
      project_data: projectData,
    }).select("*").single()
    if (error || !project) {
      console.error("ResearchFolio project create failed:", error)
      return NextResponse.json({ error: "Could not create your research project. Check that the ResearchFolio migration is applied." }, { status: 500 })
    }
    return NextResponse.json({ project }, { status: 201 })
  }

  const id = typeof body.id === "string" ? body.id : ""
  if (!id) return NextResponse.json({ error: "Project id is required to save changes." }, { status: 400 })
  const allowedType = body.project_type === "course" ? "course" : body.project_type === "independent" ? "independent" : undefined
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.title === "string") updates.title = body.title.trim().slice(0, 180) || "Untitled research project"
  if (typeof body.topic === "string" || body.topic === null) updates.topic = body.topic
  if (typeof body.course_title === "string" || body.course_title === null) updates.course_title = body.course_title
  if (typeof body.current_stage === "string") updates.current_stage = body.current_stage.slice(0, 100)
  if (allowedType) updates.project_type = allowedType
  if (body.project_data && typeof body.project_data === "object" && !Array.isArray(body.project_data)) {
    const json = JSON.stringify(body.project_data)
    if (json.length > 500_000) return NextResponse.json({ error: "This research draft is too large to save in one request." }, { status: 413 })
    updates.project_data = body.project_data
  }

  // A finalized section is immutable until eligible feedback arrives for that exact section.
  // Once feedback unlocks it, a content change clears the active snapshot so it must be finalized again.
  if (updates.project_data && typeof updates.project_data === "object") {
    const service = createServiceClient()
    const { data: currentProject, error: currentError } = await service.from("researchfolio_projects").select("id,project_data").eq("id", id).eq("user_id", user.id).maybeSingle()
    if (currentError) return NextResponse.json({ error: "Could not verify the current section locks. Please retry." }, { status: 500 })
    if (!currentProject) return NextResponse.json({ error: "Project not found or you do not have permission to edit it." }, { status: 404 })
    const oldData = currentProject.project_data && typeof currentProject.project_data === "object" ? currentProject.project_data as Record<string, any> : {}
    const nextData = updates.project_data as Record<string, any>
    const oldSections = Array.isArray(oldData.sections) ? oldData.sections : []
    const nextSections = Array.isArray(nextData.sections) ? nextData.sections : []
    const oldLogs = oldData.sectionLogs && typeof oldData.sectionLogs === "object" ? oldData.sectionLogs : {}
    const nextLogs = nextData.sectionLogs && typeof nextData.sectionLogs === "object" ? nextData.sectionLogs : {}
    const changedFinalizedKeys = oldSections.filter((oldSection: any) => {
      if (!oldSection || typeof oldSection.key !== "string" || !oldLogs[oldSection.key]?.finalizedAt) return false
      const nextSection = nextSections.find((section: any) => section?.key === oldSection.key)
      return !nextSection || nextSection.content !== oldSection.content || nextLogs[oldSection.key]?.finalizedAt !== oldLogs[oldSection.key].finalizedAt
    }).map((section: any) => section.key)
    for (const key of changedFinalizedKeys) {
      const { data: feedbackRows, error: feedbackError } = await service.from("researchfolio_feedback").select("id").eq("project_id", id).eq("author_id", user.id).eq("section_key", key).gt("created_at", String(oldLogs[key].finalizedAt)).limit(1)
      if (feedbackError) return NextResponse.json({ error: "Could not verify section feedback. Please retry." }, { status: 500 })
      if (!feedbackRows?.length) return NextResponse.json({ error: `“${key.replaceAll("_", " ")}" is finalized and locked. It can be edited only after you receive feedback on that section.` }, { status: 409 })
      nextLogs[key] = { ...(nextLogs[key] || {}), finalizedAt: null, finalizedContent: null, unlockedByFeedbackAt: new Date().toISOString() }
    }
    nextData.sectionLogs = nextLogs
    updates.project_data = nextData
  }

  const { data: project, error } = await supabase.from("researchfolio_projects").update(updates).eq("id", id).eq("user_id", user.id).select("*").maybeSingle()
  if (error) {
    console.error("ResearchFolio project save failed:", error)
    return NextResponse.json({ error: "Could not save your changes. Your current text remains on this page; retry in a moment." }, { status: 500 })
  }
  if (!project) return NextResponse.json({ error: "Project not found or you do not have permission to edit it." }, { status: 404 })
  return NextResponse.json({ project })
}


/**
 * Permanently deletes a user's ResearchFolio project and AcademicLab sessions
 * explicitly associated with it. Research drafts, citations, and evidence logs
 * are stored inside the project's project_data JSON and disappear with the row.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Please sign in to delete a research project." }, { status: 401 })
  }
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Administrator accounts do not access student research workspaces." }, { status: 403 })
  const { data: profile } = await supabase.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile)) return NextResponse.json({ error: "Your academic role must be approved before accessing ResearchFolio." }, { status: 403 })

  let body: { id?: unknown }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }
  const id = typeof body.id === "string" ? body.id.trim() : ""
  if (!id) return NextResponse.json({ error: "Project id is required." }, { status: 400 })

  // Check ownership before touching project data or chat history.
  const { data: project, error: projectLookupError } = await supabase
    .from("researchfolio_projects")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (projectLookupError) {
    console.error("ResearchFolio delete lookup failed:", projectLookupError)
    return NextResponse.json({ error: "Could not verify project ownership. Please try again." }, { status: 500 })
  }
  if (!project) return NextResponse.json({ error: "Project not found or you do not have permission to delete it." }, { status: 404 })

  // Only delete AcademicLab sessions linked to this exact project; other chats remain untouched.
  const { data: sessions, error: sessionsLookupError } = await supabase
    .from("mentor_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("researchfolio_project_id", id)

  if (sessionsLookupError) {
    console.error("ResearchFolio chat lookup failed:", sessionsLookupError)
    return NextResponse.json({ error: "Could not verify this project's AcademicLab chats. Ensure the ResearchFolio chat-link migration has been applied." }, { status: 500 })
  }

  const sessionIds = (sessions ?? []).map((session) => session.id as string)
  if (sessionIds.length > 0) {
    const { error: messagesDeleteError } = await supabase
      .from("mentor_messages")
      .delete()
      .eq("user_id", user.id)
      .in("session_id", sessionIds)
    if (messagesDeleteError) {
      console.error("ResearchFolio chat messages delete failed:", messagesDeleteError)
      return NextResponse.json({ error: "Could not delete this project's AcademicLab messages. The project was not deleted." }, { status: 500 })
    }

    const { error: sessionsDeleteError } = await supabase
      .from("mentor_sessions")
      .delete()
      .eq("user_id", user.id)
      .eq("researchfolio_project_id", id)
    if (sessionsDeleteError) {
      console.error("ResearchFolio chat sessions delete failed:", sessionsDeleteError)
      return NextResponse.json({ error: "Could not delete this project's AcademicLab chats. The project was not deleted." }, { status: 500 })
    }
  }

  const { error: deleteError } = await supabase
    .from("researchfolio_projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (deleteError) {
    console.error("ResearchFolio project delete failed:", deleteError)
    return NextResponse.json({ error: "AcademicLab chats were removed, but the project itself could not be deleted. Please retry." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
