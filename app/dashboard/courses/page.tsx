"use client"

import { useCallback, useEffect, useState } from "react"
import { BookOpen, Copy, GraduationCap, Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type Course = { id: string; title: string; description: string; course_code?: string; status?: string; created_at?: string; professor_id?: string }
type Membership = { course_id: string; joined_at: string; courses: Course | null }
type CourseContent = { id: string; title: string; body: string; content_type: string; status: string; created_at: string }

export default function CoursesPage() {
  const [owned, setOwned] = useState<Course[]>([])
  const [enrolled, setEnrolled] = useState<Membership[]>([])
  const [canCreate, setCanCreate] = useState(false)
  const [canJoin, setCanJoin] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState<boolean | string>(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [contentDrafts, setContentDrafts] = useState<Record<string, { title: string; body: string; content_type: string }>>({})
  const [contentRows, setContentRows] = useState<Record<string, CourseContent[]>>({})
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError("")
    const response = await fetch("/api/courses", { cache: "no-store" })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Could not load courses.")
    setOwned(data.owned ?? [])
    setEnrolled(data.enrolled ?? [])
    setCanCreate(data.can_create === true)
    setCanJoin(data.can_join === true)
  }, [])
  useEffect(() => { load().catch(e => setError(e instanceof Error ? e.message : "Could not load courses.")) }, [load])

  async function submit(action: "create" | "join") {
    setBusy(true); setMessage(""); setError("")
    try {
      const response = await fetch("/api/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action === "create" ? { action, title, description } : { action, course_code: code }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Course action failed.")
      setMessage(action === "create" ? `Course created. Joining code: ${data.course.course_code}` : `You joined ${data.course.title}.`)
      if (action === "create") { setTitle(""); setDescription("") } else setCode("")
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : "Course action failed.") }
    finally { setBusy(false) }
  }

  async function toggleContent(courseId: string) {
    if (expandedCourse === courseId) { setExpandedCourse(null); return }
    setExpandedCourse(courseId)
    if (contentRows[courseId]) return
    try {
      const response = await fetch(`/api/courses/${courseId}/content`, { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load course content.")
      setContentRows(current => ({ ...current, [courseId]: data.content ?? [] }))
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load course content.") }
  }

  async function publishContent(courseId: string) {
    const draft = contentDrafts[courseId] || { title: "", body: "", content_type: "lesson" }
    setBusy(courseId); setError(""); setMessage("")
    try {
      const response = await fetch(`/api/courses/${courseId}/content`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not publish course content.")
      setContentRows(current => ({ ...current, [courseId]: [data.content, ...(current[courseId] || [])] }))
      setContentDrafts(current => ({ ...current, [courseId]: { title: "", body: "", content_type: "lesson" } }))
      setMessage("Course content published.")
    } catch (e) { setError(e instanceof Error ? e.message : "Could not publish course content.") }
    finally { setBusy("") }
  }

  async function copyCode(value: string) {
    try { await navigator.clipboard.writeText(value); setMessage("Course code copied.") }
    catch { setMessage(`Course code: ${value}`) }
  }

  return <div className="mx-auto flex max-w-5xl flex-col gap-8">
    <header><p className="text-sm font-medium uppercase tracking-[.18em] text-primary">Learn together</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Courses</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Join a professor's course with a course code, or manage courses you teach. Access is limited to approved academic accounts.</p></header>
    {(message || error) && <div role={error ? "alert" : "status"} className={`rounded-xl border p-3 text-sm ${error ? "border-destructive/30 text-destructive" : "border-primary/25 text-foreground"}`}>{error || message}</div>}
    <div className="grid gap-5 md:grid-cols-2">
      {canCreate && <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Plus className="size-5" /></div><div><h2 className="font-semibold">Create a course</h2><p className="text-sm text-muted-foreground">For approved professors</p></div></div><div className="mt-5 space-y-3"><label className="block text-sm font-medium">Course title<input value={title} onChange={e => setTitle(e.target.value)} maxLength={160} placeholder="e.g. Computational Mathematics" className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></label><label className="block text-sm font-medium">Description<textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={5000} rows={3} placeholder="What will students learn?" className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" /></label><Button disabled={Boolean(busy) || title.trim().length < 3} onClick={() => void submit("create")}>{busy ? "Working…" : "Create course"}</Button></div></section>}
      {canJoin && <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><GraduationCap className="size-5" /></div><div><h2 className="font-semibold">Join a course</h2><p className="text-sm text-muted-foreground">Enter the code shared by your professor</p></div></div><div className="mt-5 space-y-3"><label className="block text-sm font-medium">Course code<input value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 10))} maxLength={10} placeholder="10-character code" className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm tracking-widest" /></label><Button disabled={Boolean(busy) || code.length !== 10} onClick={() => void submit("join")}>Join course</Button></div></section>}
    </div>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Courses you teach</h2><Button variant="ghost" size="sm" onClick={() => void load()}><RefreshCw className="mr-2 size-3.5" />Refresh</Button></div>{owned.length ? <div className="grid gap-3 md:grid-cols-2">{owned.map(course => <article key={course.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start gap-3"><BookOpen className="mt-1 size-5 text-primary"/><div className="min-w-0 flex-1"><h3 className="font-semibold">{course.title}</h3><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{course.description || "No description added."}</p><div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-secondary/60 px-3 py-2"><span className="font-mono text-sm tracking-widest">{course.course_code}</span><button onClick={() => void copyCode(course.course_code || "")} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary"><Copy className="size-3.5"/>Copy</button></div><div className="mt-4 border-t border-border pt-4"><h4 className="text-sm font-semibold">Publish course content</h4><div className="mt-3 space-y-2"><input value={(contentDrafts[course.id] || { title: "", body: "", content_type: "lesson" }).title} onChange={e => setContentDrafts(current => ({ ...current, [course.id]: { ...(current[course.id] || { title: "", body: "", content_type: "lesson" }), title: e.target.value } }))} maxLength={180} placeholder="Content title" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"/><select value={(contentDrafts[course.id] || { title: "", body: "", content_type: "lesson" }).content_type} onChange={e => setContentDrafts(current => ({ ...current, [course.id]: { ...(current[course.id] || { title: "", body: "", content_type: "lesson" }), content_type: e.target.value } }))} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="lesson">Lesson</option><option value="announcement">Announcement</option><option value="assignment">Assignment</option><option value="resource">Resource</option></select><textarea value={(contentDrafts[course.id] || { title: "", body: "", content_type: "lesson" }).body} onChange={e => setContentDrafts(current => ({ ...current, [course.id]: { ...(current[course.id] || { title: "", body: "", content_type: "lesson" }), body: e.target.value } }))} rows={3} maxLength={50000} placeholder="Write a lesson, announcement, assignment, or resource description" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"/><Button size="sm" disabled={busy === course.id || !(contentDrafts[course.id]?.title || "").trim()} onClick={() => void publishContent(course.id)}>{busy === course.id ? "Publishing…" : "Publish content"}</Button></div><button onClick={() => void toggleContent(course.id)} className="mt-3 text-xs font-medium text-primary hover:underline">{expandedCourse === course.id ? "Hide course content" : "View published content"}</button>{expandedCourse === course.id && <div className="mt-3 space-y-2">{(contentRows[course.id] || []).length ? contentRows[course.id].map(item => <article key={item.id} className="rounded-lg bg-secondary/40 p-3"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-muted-foreground">{item.body}</p><p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">{item.content_type} · {item.status}</p></article>) : <p className="text-xs text-muted-foreground">No course content yet.</p>}</div>}</div></div></div></article>)}</div> : <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">{canCreate ? "You have not created a course yet." : "Courses you teach will appear here if you have professor permissions."}</p>}</section>
    <section><h2 className="mb-3 text-lg font-semibold">Courses you have joined</h2>{enrolled.length ? <div className="grid gap-3 md:grid-cols-2">{enrolled.map(item => item.courses && <article key={item.course_id} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start gap-3"><BookOpen className="mt-1 size-5 text-primary"/><div><h3 className="font-semibold">{item.courses.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.courses.description || "No description added."}</p><p className="mt-3 text-xs text-muted-foreground">Joined {new Date(item.joined_at).toLocaleDateString()}</p><button onClick={() => void toggleContent(item.course_id)} className="mt-3 text-xs font-medium text-primary hover:underline">{expandedCourse === item.course_id ? "Hide course content" : "View course content"}</button>{expandedCourse === item.course_id && <div className="mt-3 space-y-2">{(contentRows[item.course_id] || []).length ? contentRows[item.course_id].map(content => <article key={content.id} className="rounded-lg bg-secondary/40 p-3"><p className="text-sm font-semibold">{content.title}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-muted-foreground">{content.body}</p><p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">{content.content_type}</p></article>) : <p className="text-xs text-muted-foreground">No published content yet.</p>}</div>}</div></div></article>)}</div> : <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">Courses you join with a valid code will appear here.</p>}</section>
  </div>
}
