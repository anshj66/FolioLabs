import Link from "next/link"
import { redirect } from "next/navigation"
import { BookOpen, CheckCircle2, Clock3, FileText, FlaskConical, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"
import { isApprovedAcademic, normalizeAcademicRole } from "@/lib/platform/permissions"

export const dynamic = "force-dynamic"
export default async function EvidencePage() {
  const session = await createClient(); const { data: { user } } = await session.auth.getUser()
  if (!user) redirect("/signin")
  if (isAdminEmail(user.email) || normalizeAcademicRole((await session.from("profiles").select("academic_role").eq("id", user.id).maybeSingle()).data?.academic_role) === "professor") redirect("/dashboard")
  const { data: profile } = await session.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile)) redirect("/dashboard/onboarding")
  const service = createServiceClient()
  const { data: projects, error } = await service.from("researchfolio_projects").select("id,title,topic,project_data,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(100)
  const evidence: { id: string; projectId: string; projectTitle: string; kind: string; title: string; detail: string; date?: string; finalized: boolean }[] = []
  for (const project of projects ?? []) {
    const data = project.project_data && typeof project.project_data === "object" ? project.project_data as any : {}
    const sections = Array.isArray(data.sections) ? data.sections : []
    const logs = data.sectionLogs && typeof data.sectionLogs === "object" ? data.sectionLogs : {}
    for (const section of sections) {
      if (!section || typeof section.key !== "string") continue
      const content = typeof section.content === "string" ? section.content.trim() : ""
      const log = logs[section.key] || {}
      if (!content && !log.finalizedAt) continue
      evidence.push({ id: `${project.id}:${section.key}`, projectId: project.id, projectTitle: project.title || "Untitled project", kind: "Research section", title: section.title || section.key, detail: content ? content.slice(0, 480) : "Section finalized without saved text preview.", date: log.finalizedAt || project.updated_at, finalized: Boolean(log.finalizedAt) })
    }
    const reflections = Array.isArray(data.reflectionJournals) ? data.reflectionJournals : Array.isArray(data.reflections) ? data.reflections : []
    for (let i=0;i<reflections.length;i++) { const item = reflections[i]; if (typeof item === "string" && item.trim()) evidence.push({ id:`${project.id}:reflection:${i}`,projectId:project.id,projectTitle:project.title||"Untitled project",kind:"Reflection",title:`Reflection ${i+1}`,detail:item.slice(0,480),date:project.updated_at,finalized:false }); else if (item && typeof item.content === "string" && item.content.trim()) evidence.push({id:`${project.id}:reflection:${i}`,projectId:project.id,projectTitle:project.title||"Untitled project",kind:"Reflection",title:item.title||`Reflection ${i+1}`,detail:item.content.slice(0,480),date:item.createdAt||project.updated_at,finalized:false}) }
    const citations = Array.isArray(data.citations) ? data.citations : Array.isArray(data.sources) ? data.sources : []
    citations.forEach((citation: any, i: number) => { const label = typeof citation === "string" ? citation : citation?.title || citation?.url || citation?.source; if (typeof label === "string" && label.trim()) evidence.push({id:`${project.id}:source:${i}`,projectId:project.id,projectTitle:project.title||"Untitled project",kind:"Source / citation",title:label.slice(0,180),detail:typeof citation === "object" ? String(citation.url || citation.doi || citation.note || "Source recorded in the project.").slice(0,480) : "Source recorded in the project.",date:project.updated_at,finalized:false}) })
  }
  evidence.sort((a,b)=>Date.parse(b.date||"")-Date.parse(a.date||""))
  const finalized = evidence.filter(e=>e.finalized).length
  return <main className="mx-auto max-w-6xl space-y-7"><header className="rounded-3xl border border-border bg-card p-7 sm:p-9"><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Research record</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Evidence timeline</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">This page reads actual ResearchFolio section snapshots, reflections, and sources saved with your projects. It does not invent evidence or claim independent verification.</p><div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-lg"><div className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Recorded items</p><p className="mt-2 text-2xl font-semibold">{evidence.length}</p></div><div className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Finalized sections</p><p className="mt-2 text-2xl font-semibold">{finalized}</p></div></div></header>{error ? <p className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">Could not load your research records.</p> : evidence.length ? <section className="rounded-2xl border border-border bg-card"><div className="divide-y divide-border">{evidence.map(item=><article key={item.id} className="flex gap-4 p-5 sm:p-6"><div className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${item.finalized ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>{item.finalized ? <CheckCircle2 className="size-5"/> : item.kind==="Source / citation" ? <BookOpen className="size-5"/> : item.kind==="Reflection" ? <Clock3 className="size-5"/> : <FileText className="size-5"/>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{item.title}</h2><span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] text-muted-foreground">{item.kind}</span>{item.finalized && <span className="text-[10px] font-semibold text-primary">Finalized</span>}</div><p className="mt-1 text-xs text-muted-foreground">{item.projectTitle}{item.date ? ` · ${new Date(item.date).toLocaleDateString()}` : ""}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.detail}</p><Link href={`/dashboard/projects/researchfolio?id=${encodeURIComponent(item.projectId)}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Open project <FlaskConical className="size-3.5"/></Link></div></article>)}</div></section> : <section className="rounded-2xl border border-dashed border-border px-6 py-14 text-center"><ShieldCheck className="mx-auto size-10 text-muted-foreground/40"/><h2 className="mt-3 font-semibold">No evidence recorded yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Save sections, finalize milestones, add reflections, and cite sources in ResearchFolio. Your actual records will appear here.</p><Link href="/dashboard/projects/researchfolio" className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Open ResearchFolio</Link></section>}</main>
}
