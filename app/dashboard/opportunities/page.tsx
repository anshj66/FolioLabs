"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { ArrowUpRight, Building2, CalendarDays, Loader2, Plus, RefreshCw, ShieldCheck, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Opportunity = {
  id: string; title: string; organization: string; type: string; category: string; short_description: string; description: string; eligibility: string; location: string; mode: string; start_date: string; deadline: string; prize_details: string; benefits: string[]; application_url: string; source_url: string; tags: string[]; status: "draft" | "published"; created_at: string
}
type FormState = Omit<Opportunity, "id" | "created_at"> 
const emptyForm: FormState = { title: "", organization: "", type: "Competition", category: "", short_description: "", description: "", eligibility: "", location: "", mode: "Online", start_date: "", deadline: "", prize_details: "", benefits: [], application_url: "", source_url: "", tags: [], status: "draft" }
const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
const labelClass = "mb-1.5 block text-sm font-medium"
const types = ["Competition", "Hackathon", "Internship", "Research", "Fellowship", "Scholarship", "Course", "Grant", "Job", "Other"]

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [form, setForm] = useState<FormState>(emptyForm)

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const response = await fetch("/api/opportunities", { cache: "no-store" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Could not load opportunities.")
      setItems(result.opportunities ?? []); setIsAdmin(result.isAdmin === true)
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load opportunities.") }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  function startCreate() { setEditingId(null); setForm(emptyForm); setError(""); setNotice(""); setEditorOpen(true) }
  function startEdit(item: Opportunity) {
    setEditingId(item.id)
    setForm({ title: item.title ?? "", organization: item.organization ?? "", type: item.type ?? "Other", category: item.category ?? "", short_description: item.short_description ?? "", description: item.description ?? "", eligibility: item.eligibility ?? "", location: item.location ?? "", mode: item.mode ?? "Online", start_date: item.start_date ?? "", deadline: item.deadline ?? "", prize_details: item.prize_details ?? "", benefits: item.benefits ?? [], application_url: item.application_url ?? "", source_url: item.source_url ?? "", tags: item.tags ?? [], status: item.status ?? "draft" })
    setError(""); setNotice(""); setEditorOpen(true)
  }
  function set<K extends keyof FormState>(key: K, value: FormState[K]) { setForm(old => ({ ...old, [key]: value })) }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError(""); setNotice("")
    const payload = { ...form, tags: form.tags, benefits: form.benefits }
    try {
      const response = await fetch("/api/opportunities", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Could not save opportunity.")
      setNotice(form.status === "published" ? "Opportunity published successfully." : "Draft saved successfully.")
      setEditorOpen(false); await load()
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save opportunity.") }
    finally { setSaving(false) }
  }
  async function remove(item: Opportunity) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return
    setError("")
    const response = await fetch(`/api/opportunities?id=${encodeURIComponent(item.id)}`, { method: "DELETE" })
    const result = await response.json()
    if (!response.ok) { setError(result.error || "Could not delete opportunity."); return }
    setNotice("Opportunity deleted."); await load()
  }
  async function toggleStatus(item: Opportunity) {
    const response = await fetch("/api/opportunities", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, status: item.status === "published" ? "draft" : "published" }) })
    const result = await response.json()
    if (!response.ok) { setError(result.error || "Could not update status."); return }
    setNotice(item.status === "published" ? "Opportunity unpublished." : "Opportunity published."); await load()
  }
  const visible = items.filter(item => {
    const q = search.toLowerCase()
    return (!q || [item.title, item.organization, item.description, ...(item.tags ?? [])].some(v => (v ?? "").toLowerCase().includes(q))) && (typeFilter === "All" || item.type === typeFilter) && (!isAdmin || statusFilter === "All" || item.status === statusFilter)
  })
  const publishedCount = items.filter(x => x.status === "published").length

  return <div className="mx-auto flex max-w-6xl flex-col gap-7 pb-10">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium uppercase tracking-[.18em] text-primary">Opportunity radar</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Opportunities to build your future.</h1><p className="mt-2 max-w-2xl text-muted-foreground">Discover competitions, research roles, internships, fellowships, scholarships, and more.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="mr-2 size-4"/>Refresh</Button>{isAdmin && <Button onClick={startCreate}><Plus className="mr-2 size-4"/>Post opportunity</Button>}</div></div>
    {isAdmin && <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4"><ShieldCheck className="size-5 shrink-0 text-primary"/><div><p className="text-sm font-semibold">Admin workspace</p><p className="text-sm text-muted-foreground">Create listings, save drafts, publish to members, or edit existing posts.</p></div><span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">{publishedCount} published · {items.length - publishedCount} drafts</span></div>}
    {notice && <div className="rounded-lg border border-primary/30 px-4 py-3 text-sm">{notice}</div>}{error && <div role="alert" className="rounded-lg border border-destructive/40 px-4 py-3 text-sm text-destructive">{error}</div>}
    <div className="grid gap-3 sm:grid-cols-[1fr_190px]"><input aria-label="Search opportunities" className={inputClass} placeholder="Search by title, organization, or keyword…" value={search} onChange={e => setSearch(e.target.value)}/><select aria-label="Filter by type" className={inputClass} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option>All</option>{types.map(t => <option key={t}>{t}</option>)}</select></div>
    {isAdmin && <div className="flex flex-wrap items-center gap-2 text-sm"><span className="text-muted-foreground">Show:</span>{["All", "published", "draft"].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full border px-3 py-1.5 capitalize ${statusFilter === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{s}</button>)}</div>}
    {loading ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin"/>Loading opportunities…</div> : visible.length === 0 ? <Card><CardContent className="flex flex-col items-center py-14 text-center"><Building2 className="mb-3 size-8 text-muted-foreground"/><h2 className="font-semibold">{items.length ? "No matching opportunities" : isAdmin ? "Your opportunity board is ready" : "No opportunities published yet"}</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">{items.length ? "Try a different search or filter." : isAdmin ? "Post your first listing. Publish it when it is ready for members." : "Check back soon for new competitions, research roles, internships, and more."}</p>{isAdmin && items.length === 0 && <Button className="mt-4" onClick={startCreate}><Plus className="mr-2 size-4"/>Post first opportunity</Button>}</CardContent></Card> : <section className="grid gap-4">{visible.map(item => <Card key={item.id} className="transition-colors hover:border-primary/40"><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 gap-3"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="size-5"/></div><div className="min-w-0"><div className="mb-1 flex flex-wrap items-center gap-2"><span className="rounded-full bg-secondary px-2.5 py-1 text-xs">{item.type || "Opportunity"}</span>{isAdmin && <span className={`rounded-full px-2.5 py-1 text-xs ${item.status === "published" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>{item.status}</span>}</div><CardTitle className="break-words">{item.title}</CardTitle><CardDescription className="mt-1">{item.organization}{item.location ? ` · ${item.location}` : ""}{item.mode ? ` · ${item.mode}` : ""}</CardDescription></div></div>{item.deadline && <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3.5"/>Deadline: {item.deadline}</span>}</div></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{item.short_description || item.description}</p>{item.prize_details && <div className="mt-3 rounded-lg bg-primary/5 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Prizes / rewards</p><p className="mt-1 whitespace-pre-wrap text-sm">{item.prize_details}</p></div>}{item.tags?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{item.tags.map(tag => <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">{tag}</span>)}</div>}<details className="mt-4"><summary className="cursor-pointer text-sm font-medium text-primary">View full details</summary><div className="mt-3 space-y-3 text-sm"><p className="whitespace-pre-wrap leading-6">{item.description}</p>{item.eligibility && <p><strong>Eligibility: </strong><span className="whitespace-pre-wrap">{item.eligibility}</span></p>}{item.start_date && <p><strong>Start date: </strong>{item.start_date}</p>}{item.benefits?.length > 0 && <div><strong>Benefits:</strong><ul className="mt-1 list-disc pl-5">{item.benefits.map(b => <li key={b}>{b}</li>)}</ul></div>}{item.source_url && <p><strong>Source: </strong><a className="underline" href={item.source_url} target="_blank" rel="noreferrer">Official listing</a></p>}</div></details><div className="mt-5 flex flex-wrap gap-2"><Button size="sm" onClick={() => window.open(item.application_url, "_blank", "noopener,noreferrer")}>Apply / Learn more <ArrowUpRight className="ml-1 size-4"/></Button>{isAdmin && <><Button size="sm" variant="outline" onClick={() => startEdit(item)}>Edit</Button><Button size="sm" variant="outline" onClick={() => void toggleStatus(item)}>{item.status === "published" ? "Unpublish" : "Publish"}</Button><Button size="sm" variant="outline" onClick={() => void remove(item)} aria-label={`Delete ${item.title}`}><Trash2 className="mr-1 size-4"/>Delete</Button></>}</div></CardContent></Card>)}</section>}
    {editorOpen && isAdmin && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="opportunity-editor-title"><div className="mx-auto my-4 max-w-3xl rounded-2xl border border-border bg-background shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-border bg-background p-5"><div><h2 id="opportunity-editor-title" className="text-xl font-semibold">{editingId ? "Edit opportunity" : "Post an opportunity"}</h2><p className="mt-1 text-sm text-muted-foreground">Add clear details so members can decide if it fits.</p></div><Button variant="ghost" size="icon" onClick={() => setEditorOpen(false)} aria-label="Close editor"><X className="size-4"/></Button></div><form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2"><div><label className={labelClass}>Opportunity title *</label><input required maxLength={160} className={inputClass} value={form.title} onChange={e => set("title",e.target.value)} placeholder="e.g. National Innovation Challenge"/></div><div><label className={labelClass}>Organization / host *</label><input required className={inputClass} value={form.organization} onChange={e => set("organization",e.target.value)} placeholder="Organization name"/></div><div><label className={labelClass}>Opportunity type *</label><select className={inputClass} value={form.type} onChange={e => set("type",e.target.value)}>{types.map(t => <option key={t}>{t}</option>)}</select></div><div><label className={labelClass}>Category / field</label><input className={inputClass} value={form.category} onChange={e => set("category",e.target.value)} placeholder="AI, Mathematics, Entrepreneurship…"/></div><div><label className={labelClass}>Location</label><input className={inputClass} value={form.location} onChange={e => set("location",e.target.value)} placeholder="Remote, India, city…"/></div><div><label className={labelClass}>Mode</label><select className={inputClass} value={form.mode} onChange={e => set("mode",e.target.value)}>{["Online","In-person","Hybrid","Remote","On-campus","Not specified"].map(x => <option key={x}>{x}</option>)}</select></div><div><label className={labelClass}>Start date</label><input type="date" className={inputClass} value={form.start_date} onChange={e => set("start_date",e.target.value)}/></div><div><label className={labelClass}>Application deadline</label><input type="date" className={inputClass} value={form.deadline} onChange={e => set("deadline",e.target.value)}/></div></div>
      <div><label className={labelClass}>Short summary</label><textarea rows={2} maxLength={400} className={inputClass} value={form.short_description} onChange={e => set("short_description",e.target.value)} placeholder="A concise summary shown on the opportunity card."/></div>
      <div><label className={labelClass}>Full description *</label><textarea required minLength={20} rows={6} className={inputClass} value={form.description} onChange={e => set("description",e.target.value)} placeholder="What is the opportunity? What will participants do? Include stages, format, and important instructions."/></div>
      <div><label className={labelClass}>Eligibility and requirements</label><textarea rows={3} className={inputClass} value={form.eligibility} onChange={e => set("eligibility",e.target.value)} placeholder="Eligible year / degree, age, location, team size, prerequisites…"/></div>
      <div><label className={labelClass}>Prizes / stipend / rewards</label><textarea rows={3} className={inputClass} value={form.prize_details} onChange={e => set("prize_details",e.target.value)} placeholder="e.g. ₹1,00,000 first prize; internship interviews; monthly stipend. State if not applicable."/></div>
      <div><label className={labelClass}>Benefits (one per line)</label><textarea rows={3} className={inputClass} value={form.benefits.join("\n")} onChange={e => set("benefits",e.target.value.split("\n").filter(Boolean))} placeholder="Mentorship\nCertificate\nNetworking with researchers"/></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label className={labelClass}>Application / registration URL *</label><input type="url" required className={inputClass} value={form.application_url} onChange={e => set("application_url",e.target.value)} placeholder="https://…"/></div><div><label className={labelClass}>Official source URL</label><input type="url" className={inputClass} value={form.source_url} onChange={e => set("source_url",e.target.value)} placeholder="https://…"/></div></div>
      <div><label className={labelClass}>Tags (comma-separated)</label><input className={inputClass} value={form.tags.join(", ")} onChange={e => set("tags",e.target.value.split(",").map(x => x.trim()).filter(Boolean))} placeholder="AI, Undergraduate, Paid, Team event"/></div>
      <div><label className={labelClass}>Publishing status</label><select className={inputClass} value={form.status} onChange={e => set("status",e.target.value as "draft" | "published")}><option value="draft">Save as draft — admin only</option><option value="published">Publish — visible to all members</option></select></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 size-4 animate-spin"/>}{form.status === "published" ? "Publish opportunity" : "Save draft"}</Button></div>
    </form></div></div>}
  </div>
}
