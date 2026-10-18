import Link from "next/link"
import { redirect } from "next/navigation"
import { Users, FolderKanban, ArrowUpRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"

export default async function AdminStudentsProjectsPage() {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user || !isAdminEmail(user.email)) redirect("/dashboard")

  const admin = createServiceClient()
  const [{ data: profiles, error: profilesError, count: profileCount }, { data: projects, error: projectsError, count: projectCount }] = await Promise.all([
    admin.from("profiles").select("id,full_name,role,is_public", { count: "exact" }).limit(100),
    admin.from("projects").select("*", { count: "exact" }).limit(100),
  ])
  const rows = (projects ?? []) as Record<string, unknown>[]
  const label = (row: Record<string, unknown>, keys: string[], fallback: string) => {
    for (const key of keys) if (typeof row[key] === "string" && row[key]) return row[key] as string
    return fallback
  }

  return <div className="mx-auto flex max-w-6xl flex-col gap-6">
    <div><p className="text-sm font-medium uppercase tracking-[.18em] text-primary">Administration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Students and Projects</h1><p className="mt-2 text-muted-foreground">Platform-wide student profiles and submitted projects, including private profiles.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-3"><Users className="size-5 text-primary"/><p className="text-sm text-muted-foreground">Profiles on platform</p></div><p className="mt-3 text-3xl font-semibold">{profileCount ?? profiles?.length ?? 0}</p></section>
      <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-3"><FolderKanban className="size-5 text-primary"/><p className="text-sm text-muted-foreground">Projects</p></div><p className="mt-3 text-3xl font-semibold">{projectCount ?? projects?.length ?? 0}</p></section>
    </div>
    <section className="rounded-2xl border border-border bg-card"><div className="border-b border-border p-5"><h2 className="font-semibold">Student profiles</h2><p className="mt-1 text-sm text-muted-foreground">Up to 100 profiles shown. Private status does not hide profiles from the admin.</p></div>
      {profilesError ? <p className="p-5 text-sm text-muted-foreground">Could not load profiles. Check the service-role configuration and profiles table.</p> : <div className="divide-y divide-border">{(profiles ?? []).map(profile => <div key={profile.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{profile.full_name || "Unnamed member"}</p><p className="mt-1 text-xs text-muted-foreground">{profile.role || "Role not verified"} · {profile.is_public ? "Public profile" : "Private profile"}</p></div><Link href={`/dashboard/community/${profile.id}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">Open profile <ArrowUpRight className="size-4"/></Link></div>)}</div>}
    </section>
    <section className="rounded-2xl border border-border bg-card"><div className="border-b border-border p-5"><h2 className="font-semibold">Projects</h2><p className="mt-1 text-sm text-muted-foreground">Up to 100 project records.</p></div>
      {projectsError ? <p className="p-5 text-sm text-muted-foreground">Could not load projects. Check that the projects table exists and that its service-role access is configured.</p> : rows.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No projects found.</p> : <div className="divide-y divide-border">{rows.map((project, index) => <div key={String(project.id ?? index)} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{label(project, ["title", "name", "project_name"], `Project ${index + 1}`)}</p><p className="mt-1 text-xs text-muted-foreground">{label(project, ["status"], "Status unavailable")} · Owner: {label(project, ["user_id", "owner_id", "created_by"], "Unknown")}</p></div></div>)}</div>}
    </section>
  </div>
}
