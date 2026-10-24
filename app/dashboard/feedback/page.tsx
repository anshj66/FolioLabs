"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Inbox, MessageSquareText, RefreshCw, Send, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

type FeedbackItem = { id: string; project_id: string; project_title: string; section_key: string; feedback: string; status: string; created_at: string; reviewer_label?: string; recipient_label?: string }
export default function FeedbackPage() {
  const [tab, setTab] = useState<"received" | "given">("received")
  const [professor, setProfessor] = useState(false)
  const [received, setReceived] = useState<FeedbackItem[]>([])
  const [given, setGiven] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const response = await fetch("/api/researchfolio/feedback", { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load feedback.")
      setProfessor(data.professor === true); setReceived(data.received ?? []); setGiven(data.given ?? [])
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load feedback.") }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  const items = tab === "received" ? received : given
  return <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-5 sm:p-7">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">{professor ? "Research intelligence" : "Research feedback"}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{professor ? "Research Insights" : "Feedback inbox"}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{professor ? "Anonymous perspectives on your research, organised by project and section. Faculty accounts are not part of student peer-review or Merit Credit workflows." : "Read anonymous feedback on your work and revisit the constructive reviews you have contributed. Names are hidden from both sides."}</p></div><Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 size-4"/>Refresh</Button></header>
    {!professor && <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1"><button onClick={() => setTab("received")} className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition ${tab === "received" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-secondary"}`}><Inbox className="size-4"/>Received <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs">{received.length}</span></button><button onClick={() => setTab("given")} className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition ${tab === "given" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-secondary"}`}><Send className="size-4"/>Given <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs">{given.length}</span></button></div>}
    {error && <p role="alert" className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
    {loading ? <div className="grid gap-3">{[1,2,3].map(n => <div key={n} className="h-36 animate-pulse rounded-2xl bg-secondary/70"/>)}</div> : items.length ? <div className="space-y-3">{items.map(item => <article key={item.id} className="group rounded-2xl border border-border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><MessageSquareText className="size-5"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{item.project_title}</h2><span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">{item.section_key === "__project__" ? "Whole project" : item.section_key.replaceAll("_", " ")}</span></div><p className="mt-1 text-xs text-muted-foreground">{professor ? "Anonymous research insight" : tab === "received" ? "From an anonymous reviewer" : "Sent anonymously"} · {new Date(item.created_at).toLocaleString()}</p><p className="mt-4 whitespace-pre-wrap text-sm leading-7">{item.feedback}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"><span className="inline-flex items-center gap-1.5 text-xs text-primary"><ShieldCheck className="size-3.5"/>Anonymous by design</span><Link href={`/dashboard/projects/researchfolio?id=${encodeURIComponent(item.project_id)}`} className="text-xs font-semibold text-primary hover:underline">Open project →</Link></div></div></div></article>)}</div> : <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center"><Inbox className="mx-auto size-9 text-muted-foreground/40"/><h2 className="mt-3 font-semibold">{professor ? "No research insights yet" : tab === "received" ? "No feedback yet" : "No feedback contributions yet"}</h2><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{professor ? "When anonymous research insights are submitted on your published work, they will appear here without exposing reviewer identities." : tab === "received" ? "When an eligible researcher reviews your published work, their feedback will appear here without revealing their identity." : "Reviews you submit through Community Review will be recorded here so you can revisit your contributions."}</p>{!professor && <Link href="/dashboard/community-review" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Go to Community Review →</Link>}</div>}
  </main>
}
