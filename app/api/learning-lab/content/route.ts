import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"
import { isApprovedAcademic } from "@/lib/platform/permissions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function GET() {
  const session = await createClient()
  const { data: { user }, error } = await session.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Please sign in to access Learning Lab content." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ modules: [], admin: true })
  const { data: profile } = await session.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile)) return NextResponse.json({ error: "Your academic role must be approved before accessing Learning Lab content." }, { status: 403 })
  try {
    const service = createServiceClient()
    const { data: modules, error: moduleError } = await service.from("learning_lab_modules").select("id,slug,title,subject,description,cover_image_url,sequence,updated_at").eq("status", "published").order("sequence", { ascending: true }).order("created_at", { ascending: false })
    if (moduleError) throw moduleError
    const ids = (modules ?? []).map(module => module.id)
    const { data: units, error: unitError } = ids.length ? await service.from("learning_lab_units").select("id,module_id,slug,title,summary,unit_type,content_markdown,resource_url,content_config,sequence,updated_at").in("module_id", ids).eq("status", "published").order("sequence", { ascending: true }) : { data: [], error: null }
    if (unitError) throw unitError
    const unitGroups = new Map<string, any[]>()
    for (const unit of units ?? []) unitGroups.set(unit.module_id, [...(unitGroups.get(unit.module_id) ?? []), unit])
    const { data: progress } = await service.from("learning_lab_progress").select("module_id,unit_id,status,completion_percent,last_activity_at").eq("user_id", user.id)
    return NextResponse.json({ modules: (modules ?? []).map(module => ({ ...module, units: unitGroups.get(module.id) ?? [], progress: (progress ?? []).filter(item => item.module_id === module.id) })) })
  } catch (error) {
    console.error("Learning Lab content query failed", error)
    return NextResponse.json({ error: "Could not load published Learning Lab content. Apply the Phase 2 migration first." }, { status: 500 })
  }
}
