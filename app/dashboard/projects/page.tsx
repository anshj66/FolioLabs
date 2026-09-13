"use client"

import { useState } from "react"
import { ArrowUpRight, FlaskConical, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProjectsPage() {
  const [created, setCreated] = useState(false)

  return <div className="mx-auto flex max-w-6xl flex-col gap-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-medium uppercase tracking-[.18em] text-primary">My projects</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Work worth showing.</h1><p className="mt-2 max-w-2xl text-muted-foreground">Keep your experiments, decisions, and evidence connected.</p></div><Button onClick={() => setCreated(true)}><Plus data-icon="inline-start" /> Create my project</Button></div><div className="rounded-2xl border border-border bg-card p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"><FlaskConical className="size-6" /></div><div className="min-w-0 flex-1"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><h2 className="text-lg font-semibold">Eigenvalues in Network Influence</h2><p className="mt-1 text-sm text-muted-foreground">Mathematics · Active project</p></div><span className="w-fit rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">42% complete</span></div><p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">Explore how the dominant eigenvalue and eigenvector reveal influential nodes in a network, then explain the result in your own words.</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full w-[42%] rounded-full bg-primary" /></div><div className="mt-5 flex flex-wrap gap-2"><Button size="sm">Open project <ArrowUpRight data-icon="inline-end" /></Button><Button size="sm" variant="outline">Add evidence</Button></div></div></div></div>{created && <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary" role="status">Your new project draft is ready to name and shape.</div>}</div>
}
