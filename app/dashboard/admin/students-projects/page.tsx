import Link from "next/link"
import { redirect } from "next/navigation"
import { Users, FolderKanban, ArrowUpRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"

export default async function AdminStudentsProjectsPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user || !isAdminEmail(user.email)) redirect("/dashboard")

  const { role: selectedRole = "all" } = await searchParams
  const admin = createServiceClient()
  const [{ data: profiles, error: profilesError }, { data: projects, error: projectsError, count: projectCount }, { data: researchfolioProjects, error: researchfolioError, count: researchfolioCount }] = await Promise.all([
    admin.from("profiles").select("id,full_name,role,is_public,academic_role,academic_year,verification_status", { count: "exact" }).limit(1000),
    admin.from("projects").select("*", { count: "exact" }).limit(100),
    admin.from("researchfolio_projects").select("id,user_id,title,topic,current_stage,community_review_status,created_at,updated_at", { count: "exact" }).limit(100),
  ])
  const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const profilesById = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]))
  const allProfiles = (authUsers?.users ?? []).filter(account => (account.email ?? "").toLowerCase() !== "anshj6627@gmail.com").map(account => { const existing: any = profilesById.get(account.id); return existing ? { ...existing, email: account.email } : ({ id: account.id, email: account.email, full_name: account.user_metadata?.full_name || account.user_metadata?.name || account.email?.split("@")[0] || "Unnamed member", role: "Not verified", academic_role: null, academic_year: null, verification_status: "not_started", is_public: false }) })
  const roleKey = (profile: any) => profile.academic_role === "professor" ? "professor" : profile.academic_role === "phd" ? "phd" : profile.academic_role === "masters" ? "masters" : profile.academic_role === "undergraduate" ? "undergraduate" : "other"
  const visibleProfiles = selectedRole === "all" ? allProfiles : allProfiles.filter((profile: any) => roleKey(profile) === selectedRole)
  const categories = [{ key: "all", label: "All users", count: allProfiles.length }, { key: "professor", label: "Professors", count: allProfiles.filter((p: any) => roleKey(p) === "professor").length }, { key: "phd", label: "PhD", count: allProfiles.filter((p: any) => roleKey(p) === "phd").length }, { key: "undergraduate", label: "Undergraduates", count: allProfiles.filter((p: any) => roleKey(p) === "undergraduate").length }, { key: "masters", label: "Masters", count: allProfiles.filter((p: any) => roleKey(p) === "masters").length }]
  const rows = (projects ?? []) as Record<string, unknown>[]
  const researchRows = (researchfolioProjects ?? []) as Record<string, unknown>[]
  const label = (row: Record<string, unknown>, keys: string[], fallback: string) => {
    for (const key of keys) if (typeof row[key] === "string" && row[key]) return row[key] as string
    return fallback
  }

  return <div className="mx-auto flex max-w-6xl flex-col gap-6">
    <div><p className="text-sm font-medium uppercase tracking-[.18em] text-primary">Administration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Users and Projects</h1><p className="mt-2 text-muted-foreground">Browse every account by academic role. Admin access bypasses public-profile visibility, while user-facing privacy remains unchanged.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-3"><Users className="size-5 text-primary"/><p className="text-sm text-muted-foreground">Profiles on platform</p></div><p className="mt-3 text-3xl font-semibold">{allProfiles.length}</p></section>
      <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-3"><FolderKanban className="size-5 text-primary"/><p className="text-sm text-muted-foreground">Projects</p></div><p className="mt-3 text-3xl font-semibold">{(projectCount ?? projects?.length ?? 0) + (researchfolioCount ?? researchfolioProjects?.length ?? 0)}</p></section>
    </div>
    <section className="rounded-2xl border border-border bg-card"><div className="border-b border-border p-5"><h2 className="font-semibold">Users</h2><p className="mt-1 text-sm text-muted-foreground">Up to 100 profiles shown. Admin profile pages work even when a user has a private profile.</p></div>
      <div className="flex flex-wrap gap-2 border-b border-border p-4">{categories.map(category => <Link key={category.key} href={category.key === "all" ? "/dashboard/admin/students-projects" : `/dashboard/admin/students-projects?role=${category.key}`} className={`rounded-full border px-3 py-2 text-xs font-medium transition ${selectedRole === category.key ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-secondary"}`}>{category.label} <span className="ml-1 opacity-75">{category.count}</span></Link>)}</div>
      {profilesError ? <p className="p-5 text-sm text-muted-foreground">Could not load profiles. Check the service-role configuration and profiles table.</p> : visibleProfiles.length ? <div className="divide-y divide-border">{visibleProfiles.map(profile => <div key={profile.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{profile.full_name || "Unnamed member"}</p><p className="mt-1 text-xs text-muted-foreground">{profile.email ? `${profile.email} · ` : ""}{profile.academic_role === "undergraduate" ? `Undergraduate${profile.academic_year ? ` · Year ${profile.academic_year}` : ""}` : (profile.academic_role || profile.role || "Role not verified")} · {profile.verification_status || "verification status unknown"} · {profile.is_public ? "Public profile" : "Private profile"}</p></div><Link href={`/dashboard/admin/users/${profile.id}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">Open profile <ArrowUpRight className="size-4" /></Link></div>)}</div> : <p className="p-5 text-sm text-muted-foreground">No users in this category yet.</p>}
    </section>
    <section className="rounded-2xl border border-border bg-card"><div className="border-b border-border p-5"><h2 className="font-semibold">Projects</h2><p className="mt-1 text-sm text-muted-foreground">Up to 100 project records.</p></div>
      {projectsError ? <p className="p-5 text-sm text-muted-foreground">Could not load projects. Check that the projects table exists and that its service-role access is configured.</p> : rows.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No projects found.</p> : <div className="divide-y divide-border">{rows.map((project, index) => <div key={String(project.id ?? index)} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{label(project, ["title", "name", "project_name"], `Project ${index + 1}`)}</p><p className="mt-1 text-xs text-muted-foreground">{label(project, ["status"], "Status unavailable")} · Owner: {label(project, ["user_id", "owner_id", "created_by"], "Unknown")}</p></div></div>)}</div>}
    </section>
    <section className="rounded-2xl border border-border bg-card"><div className="border-b border-border p-5"><h2 className="font-semibold">ResearchFolio projects</h2><p className="mt-1 text-sm text-muted-foreground">{researchfolioCount ?? researchRows.length} saved research workspaces.</p></div>
      {researchfolioError ? <p className="p-5 text-sm text-muted-foreground">Could not load ResearchFolio projects. Check the platform migration.</p> : researchRows.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No ResearchFolio projects found.</p> : <div className="divide-y divide-border">{researchRows.map((project, index) => <div key={String(project.id ?? index)} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{label(project, ["title", "topic"], `Research project ${index + 1}`)}</p><p className="mt-1 text-xs text-muted-foreground">{label(project, ["current_stage"], "Stage unavailable")} · {label(project, ["community_review_status"], "Not submitted for review")} · Owner: {label(project, ["user_id"], "Unknown")}</p></div></div>)}</div>}
    </section>
  </div>
}
