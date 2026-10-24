"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookOpen, Eye, MessageSquareText, RefreshCw, ShieldCheck, Send, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"

type Section = { key: string; title: string; content: string }
type ReviewProject = { id: string; title: string; brief: string; topic: string | null; current_stage: string; submitted_for_review_at: string | null; public_sections: Section[]; can_review: boolean }
type GivenFeedback = { id: string; project_id: string; project_title: string; section_key: string; feedback: string; status: string; created_at: string }
export default function CommunityReviewPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"projects" | "given">("projects")
  const [projects, setProjects] = useState<ReviewProject[]>([])
  const [given, setGiven] = useState<GivenFeedback[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [sectionKeys, setSectionKeys] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const load = useCallback(async () => {
    setError("")
    const [projectResponse, feedbackResponse] = await Promise.all([
      fetch("/api/researchfolio/review", { cache: "no-store" }),
      fetch("/api/researchfolio/feedback", { cache: "no-store" }),
    ])
    const [projectData, feedbackData] = await Promise.all([projectResponse.json(), feedbackResponse.json()])
    if (projectData.professor) { router.replace("/dashboard/feedback"); return }
    if (!projectResponse.ok) throw new Error(projectData.error || "Could not load the review feed.")
    if (!feedbackResponse.ok) throw new Error(feedbackData.error || "Could not load your feedback history.")
    setProjects(projectData.projects ?? [])
    setGiven(feedbackData.given ?? [])
  }, [router])
  useEffect(() => { load().catch(e => setError(e instanceof Error ? e.message : "Could not load community review.")) }, [load])
  async function submitFeedback(project: ReviewProject) {
    setBusy(project.id); setError(""); setMessage("")
    try {
      const feedback = (drafts[project.id] || "").trim()
      const section_key = sectionKeys[project.id] || "__project__"
      const response = await fetch("/api/researchfolio/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "feedback", project_id: project.id, section_key, feedback }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not submit feedback.")
      setDrafts(current => ({ ...current, [project.id]: "" }))
      setMessage("Feedback submitted anonymously. Thank you for helping another researcher.")
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : "Could not submit feedback.") }
    finally { setBusy("") }
  }
  return <div className="mx-auto flex max-w-5xl flex-col gap-7">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Collaborate & validate</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Community Review</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Peer review and community review are one workflow. Reviewers and authors remain anonymous to one another; feedback must be specific and constructive.</p></div><Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 size-4"/>Refresh</Button></header>
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1"><button onClick={() => setTab("projects")} className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition ${tab === "projects" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}><Eye className="size-4"/>Projects to review <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs">{projects.length}</span></button><button onClick={() => setTab("given")} className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition ${tab === "given" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}><Inbox className="size-4"/>Feedback given <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs">{given.length}</span></button></div>
    {(message || error) && <p role={error ? "alert" : "status"} className={`rounded-xl border p-3 text-sm ${error ? "border-destructive/30 text-destructive" : "border-primary/25"}`}>{error || message}</p>}
    {tab === "projects" ? projects.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center"><BookOpen className="mx-auto size-8 text-muted-foreground/50"/><h2 className="mt-3 font-semibold">No projects open for review</h2><p className="mt-1 text-sm text-muted-foreground">Eligible published projects will appear here.</p><Link className="mt-4 inline-block text-sm font-medium text-primary hover:underline" href="/dashboard/projects">Go to your projects</Link></div> : <div className="space-y-4">{projects.map(project => <article key={project.id} className="rounded-2xl border border-border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 sm:p-6"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><BookOpen className="size-5"/></div><div className="min-w-0 flex-1"><h2 className="text-lg font-semibold">{project.title || "Untitled research project"}</h2><p className="mt-1 text-xs text-muted-foreground">{project.topic || "Research project"} · {project.current_stage || "In progress"}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{project.brief}</p><p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 text-primary"/>Author identity hidden</p></div></div>
      <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setExpanded(expanded === project.id ? null : project.id)}>{expanded === project.id ? "Hide project content" : "Read project content"}</Button>{project.can_review ? <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"><ShieldCheck className="size-3.5"/>Eligible to review</span> : <span className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">Outside your review tier</span>}</div>
      {expanded === project.id && <div className="mt-4 space-y-3 border-t border-border pt-4">{project.public_sections.length ? project.public_sections.map(section => <section key={section.key} className="rounded-xl bg-secondary/35 p-4"><h3 className="text-sm font-semibold">{section.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{section.content || "No content provided for this section."}</p></section>) : <p className="text-sm text-muted-foreground">The author has not added public section content yet.</p>}</div>}
      {project.can_review && <div className="mt-4 border-t border-border pt-4"><label className="block text-sm font-medium">Section to review<select value={sectionKeys[project.id] || "__project__"} onChange={e => setSectionKeys(current => ({ ...current, [project.id]: e.target.value }))} className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="__project__">Overall project</option>{project.public_sections.map(section => <option key={section.key} value={section.key}>{section.title}</option>)}</select></label><label className="mt-3 block text-sm font-medium">Detailed constructive feedback<textarea value={drafts[project.id] || ""} onChange={e => setDrafts(current => ({ ...current, [project.id]: e.target.value }))} rows={4} maxLength={10000} placeholder="What is convincing? What is unclear? Point to specific reasoning, methods, evidence, limitations, or next steps." className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-6"/></label><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Minimum 30 characters and six words. Your identity will not be shown to the author.</p><Button disabled={busy === project.id || (drafts[project.id] || "").trim().length < 30} onClick={() => void submitFeedback(project)}>{busy === project.id ? "Submitting…" : <><MessageSquareText className="mr-2 size-4"/>Submit anonymously</>}</Button></div></div>}</article>)}</div> : given.length ? <div className="space-y-3">{given.map(item => <article key={item.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><Send className="size-5"/></div><div className="min-w-0 flex-1"><h2 className="font-semibold">{item.project_title}</h2><p className="mt-1 text-xs text-muted-foreground">{item.section_key === "__project__" ? "Overall project" : item.section_key.replaceAll("_", " ")} · {new Date(item.created_at).toLocaleString()}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{item.feedback}</p><p className="mt-3 text-xs text-primary">Submitted anonymously</p></div></div></article>)}</div> : <div className="rounded-2xl border border-dashed border-border p-10 text-center"><Inbox className="mx-auto size-8 text-muted-foreground/50"/><h2 className="mt-3 font-semibold">No feedback given yet</h2><p className="mt-1 text-sm text-muted-foreground">Reviews you submit will be listed here.</p></div>}
  </div>
}
