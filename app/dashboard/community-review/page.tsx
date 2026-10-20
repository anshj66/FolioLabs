"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, MessageSquareText, RefreshCw, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

type Section = { key: string; title: string; content: string }
type ReviewProject = { id: string; title: string; brief: string; topic: string | null; current_stage: string; submitted_for_review_at: string | null; author: { full_name: string; academic_role: string; academic_year: number | null } | null; public_sections: Section[]; can_review: boolean }
export default function CommunityReviewPage() {
  const [projects, setProjects] = useState<ReviewProject[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const load = useCallback(async () => {
    setError("")
    const response = await fetch("/api/researchfolio/review", { cache: "no-store" })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Could not load the review feed.")
    setProjects(data.projects ?? [])
  }, [])
  useEffect(() => { load().catch(e => setError(e instanceof Error ? e.message : "Could not load the review feed.")) }, [load])
  async function submitFeedback(project: ReviewProject) {
    setBusy(project.id); setError(""); setMessage("")
    try {
      const feedback = (drafts[project.id] || "").trim()
      const response = await fetch("/api/researchfolio/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "feedback", project_id: project.id, feedback }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not submit feedback.")
      setDrafts(current => ({ ...current, [project.id]: "" }))
      setMessage(`Feedback submitted for “${project.title}”.`)
    } catch (e) { setError(e instanceof Error ? e.message : "Could not submit feedback.") }
    finally { setBusy("") }
  }
  return <div className="mx-auto flex max-w-5xl flex-col gap-7"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium uppercase tracking-[.18em] text-primary">Collaborate & validate</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Community review</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Review published research only when your approved academic role is eligible. Feedback must be specific and constructive.</p></div><Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 size-4"/>Refresh</Button></header>
    {(message || error) && <p role={error ? "alert" : "status"} className={`rounded-xl border p-3 text-sm ${error ? "border-destructive/30 text-destructive" : "border-primary/25"}`}>{error || message}</p>}
    {projects.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center"><BookOpen className="mx-auto size-8 text-muted-foreground/50"/><h2 className="mt-3 font-semibold">No projects open for review</h2><p className="mt-1 text-sm text-muted-foreground">When eligible authors publish a project, it will appear here.</p><Link className="mt-4 inline-block text-sm font-medium text-primary hover:underline" href="/dashboard/projects">Go to your projects</Link></div> : <div className="space-y-4">{projects.map(project => <article key={project.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><BookOpen className="size-5"/></div><div className="min-w-0 flex-1"><h2 className="text-lg font-semibold">{project.title || "Untitled research project"}</h2><p className="mt-1 text-xs text-muted-foreground">{project.topic || "Research project"} · {project.current_stage || "In progress"}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{project.brief}</p><p className="mt-3 text-xs text-muted-foreground">By {project.author?.full_name || "FolioLabs member"}{project.author?.academic_role ? ` · ${project.author.academic_role}${project.author.academic_year ? `, Year ${project.author.academic_year}` : ""}` : ""}</p></div></div>
      <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setExpanded(expanded === project.id ? null : project.id)}>{expanded === project.id ? "Hide project content" : "Read project content"}</Button>{project.can_review ? <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"><ShieldCheck className="size-3.5"/>Eligible to review</span> : <span className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">Outside your review tier</span>}</div>
      {expanded === project.id && <div className="mt-4 space-y-3 border-t border-border pt-4">{project.public_sections.length ? project.public_sections.map(section => <section key={section.key} className="rounded-xl bg-secondary/35 p-4"><h3 className="text-sm font-semibold">{section.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{section.content || "No content provided for this section."}</p></section>) : <p className="text-sm text-muted-foreground">The author has not added public section content yet.</p>}</div>}
      {project.can_review && <div className="mt-4 border-t border-border pt-4"><label className="block text-sm font-medium">Your feedback<textarea value={drafts[project.id] || ""} onChange={e => setDrafts(current => ({ ...current, [project.id]: e.target.value }))} rows={4} maxLength={10000} placeholder="Comment on the research question, methods, evidence, limitations, or a concrete next step. At least 30 characters and six words." className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-6"/></label><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Feedback is linked to your approved role and recorded with a timestamp.</p><Button disabled={busy === project.id || (drafts[project.id] || "").trim().length < 30} onClick={() => void submitFeedback(project)}>{busy === project.id ? "Submitting…" : <><MessageSquareText className="mr-2 size-4"/>Submit feedback</>}</Button></div></div>}</article>)}</div>}
  </div>
}
