"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, BookOpen, CheckCircle2, Code2, FileText, FlaskConical, LoaderCircle, Plus, Sparkles } from "lucide-react"

type ResearchProject = {
  id: string
  title: string
  project_type: "independent" | "course"
  topic: string | null
  course_title: string | null
  current_stage: string
  updated_at: string
  project_data: { sections?: { key: string; title: string; content: string }[]; researchType?: string }
}

const folios = [
  { name: "ResearchFolio", eyebrow: "THINK · QUESTION · DISCOVER", description: "Turn a curiosity into a structured research project. Explore literature, shape a hypothesis, and develop a paper with AcademicLab as your research mentor.", href: "/dashboard/projects/researchfolio", cta: "Enter ResearchFolio", icon: FlaskConical, style: "research", available: true },
  { name: "CodeFolio", eyebrow: "BUILD · TEST · SHIP", description: "Capture your software journey: experiments, iterations, code decisions, and the thinking behind every release.", href: "#codefolio", cta: "Coming soon", icon: Code2, style: "code", available: false },
  { name: "CreateFolio", eyebrow: "DESIGN · MAKE · SHARE", description: "Bring creative work together with prototypes, feedback, process notes, and the story behind what you create.", href: "#createfolio", cta: "Coming soon", icon: FileText, style: "create", available: false },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ResearchProject[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/researchfolio/projects", { cache: "no-store" })
      if (!response.ok) throw new Error("Could not load your saved research projects.")
      const data = await response.json()
      setProjects(data.projects ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load saved projects.")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadProjects() }, [loadProjects])

  async function createProject() {
    setCreating(true); setError("")
    try {
      const response = await fetch("/api/researchfolio/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", project_type: "independent", title: "Untitled research project" }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? "Could not create project.")
      window.location.href = `/dashboard/projects/researchfolio?projectId=${data.project.id}`
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create project."); setCreating(false) }
  }

  return <div className="mx-auto flex max-w-7xl flex-col gap-9 pb-12">
    <style jsx>{`
      @keyframes card-rise { from {opacity:0; transform:translateY(20px)} to {opacity:1; transform:translateY(0)} }
      @keyframes art-float {0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-9px) rotate(3deg)}}
      @keyframes orbit {to{transform:rotate(360deg)}}
      .folio-choice{animation:card-rise .6s both}.folio-choice:nth-child(2){animation-delay:.1s}.folio-choice:nth-child(3){animation-delay:.2s}
      .folio-art{position:relative;isolation:isolate;overflow:hidden}.folio-art:before{content:"";position:absolute;inset:0;z-index:-2}
      .art-research:before{background:radial-gradient(circle at 50% 50%,#2dd4bf55,transparent 32%),radial-gradient(circle at 20% 20%,#38bdf833,transparent 35%),linear-gradient(135deg,#102d31,#10201f 55%,#1c2440)}
      .art-code:before{background:radial-gradient(circle at 65% 30%,#a78bfa55,transparent 32%),linear-gradient(135deg,#21163b,#111a32 65%,#172e39)}
      .art-create:before{background:radial-gradient(circle at 40% 40%,#fb718555,transparent 35%),linear-gradient(135deg,#3c1e32,#24203c 60%,#392b24)}
      .orbit{position:absolute;width:150px;height:150px;border:1px solid #ffffff32;border-radius:50%;animation:art-float 7s ease-in-out infinite}.orbit.two{width:210px;height:210px;border-style:dashed;animation-delay:-2s;animation-name:orbit;animation-duration:28s}
      .art-core{display:flex;width:76px;height:76px;align-items:center;justify-content:center;border-radius:24px;color:#d1fae5;background:#ffffff12;border:1px solid #ffffff45;box-shadow:0 18px 55px #0005;backdrop-filter:blur(12px);animation:art-float 5s ease-in-out infinite}
      @media(prefers-reduced-motion:reduce){.folio-choice,.orbit,.art-core{animation:none!important}}
    `}</style>
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><p className="text-xs font-semibold uppercase tracking-[.22em] text-primary">My projects · Folio workspace</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Build something worth understanding.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">Choose the environment that fits your work. Each Folio captures not only what you make, but the thinking behind it.</p></div>
      <button onClick={createProject} disabled={creating} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">{creating ? <LoaderCircle className="size-4 animate-spin"/> : <Plus className="size-4"/>} New research project</button>
    </div>

    <div className="grid gap-5 lg:grid-cols-3">
      {folios.map((folio) => { const Icon = folio.icon; return <article key={folio.name} className="folio-choice overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className={`folio-art art-${folio.style} flex h-48 items-center justify-center`}>
          <div className="orbit"/><div className="orbit two"/>
          <div className="absolute left-[22%] top-[25%] size-2 rounded-full bg-teal-200 shadow-[0_0_20px_#5eead4]"/><div className="absolute right-[24%] top-[38%] size-2 rounded-full bg-cyan-200 shadow-[0_0_20px_#67e8f9]"/><div className="absolute bottom-[24%] left-[38%] size-2 rounded-full bg-emerald-200 shadow-[0_0_20px_#6ee7b7]"/>
          <div className="art-core"><Icon className="size-9"/></div>
          {!folio.available && <span className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-white/75 backdrop-blur">Coming soon</span>}
        </div>
        <div className="p-6"><p className="text-[10px] font-semibold tracking-[.19em] text-primary">{folio.eyebrow}</p><h2 className="mt-3 text-xl font-semibold">{folio.name}</h2><p className="mt-3 min-h-[84px] text-sm leading-6 text-muted-foreground">{folio.description}</p>
          {folio.available ? <Link href={folio.href} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90">{folio.cta}<ArrowUpRight className="size-4"/></Link> : <button disabled className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 text-sm font-semibold text-muted-foreground">{folio.cta}</button>}
        </div></article> })}
    </div>

    <section className="rounded-3xl border border-border bg-card/70 p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Your research library</p><h2 className="mt-2 text-xl font-semibold">Pick up where you left off</h2><p className="mt-1 text-sm text-muted-foreground">Your drafts are saved to your account and follow you between sessions.</p></div><span className="text-xs text-muted-foreground">{projects.length} {projects.length === 1 ? "project" : "projects"}</span></div>
      {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error} Make sure the ResearchFolio database migration has been applied.</p>}
      {loading ? <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin"/>Loading your research…</div> : projects.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-border px-5 py-9 text-center"><div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles className="size-5"/></div><h3 className="mt-3 font-medium">Your next discovery starts here</h3><p className="mt-1 text-sm text-muted-foreground">Create a project and your work will appear here automatically.</p></div> : <div className="mt-5 grid gap-3 md:grid-cols-2">{projects.map((project) => { const data = project.project_data ?? {}; const sections = data.sections ?? []; const filled = sections.filter((s) => s.content?.trim()).length; const progress = sections.length ? Math.round(filled / sections.length * 100) : 0; return <Link key={project.id} href={`/dashboard/projects/researchfolio?projectId=${project.id}`} className="group rounded-2xl border border-border bg-background/70 p-4 transition hover:border-primary/40 hover:bg-primary/[.025]"><div className="flex items-start justify-between gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="size-5"/></div><span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-muted-foreground"><CheckCircle2 className="size-3"/>{project.current_stage || "Idea"}</span></div><h3 className="mt-4 font-semibold group-hover:text-primary">{project.title || project.topic || "Untitled research project"}</h3><p className="mt-1 text-xs text-muted-foreground">{project.project_type === "course" ? project.course_title || "University course" : "Independent research"} · Updated {new Date(project.updated_at).toLocaleDateString()}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }}/></div><p className="mt-2 text-[11px] text-muted-foreground">{filled} of {sections.length} sections started</p></Link> })}</div>}
    </section>
  </div>
}
