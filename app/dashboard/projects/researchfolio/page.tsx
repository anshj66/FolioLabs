"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, FlaskConical, GraduationCap, Lightbulb, MessageCircle, Send, Sparkles, X } from "lucide-react"

type ChatMessage = { role: "user" | "assistant"; content: string }
const courses = [
  { id: "research-methods", title: "Research Methods", detail: "Questions, evidence, and experimental design", tag: "Foundations" },
  { id: "mathematics-ai", title: "Mathematics with AI Applications", detail: "Models, simulations, and mathematical discovery", tag: "Mathematics" },
  { id: "computational-physics", title: "Computational Physics", detail: "Build models of physical systems and test them", tag: "Physics" },
  { id: "data-science", title: "Data Science & Society", detail: "Use data to investigate real-world questions", tag: "Interdisciplinary" },
]

export default function ResearchFolioPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"choose" | "idea">("choose")
  const [projectType, setProjectType] = useState<"independent" | "course">("independent")
  const [selectedCourse, setSelectedCourse] = useState("")
  const [idea, setIdea] = useState("")
  const [introduction, setIntroduction] = useState("")
  const [hypothesis, setHypothesis] = useState("")
  const [step, setStep] = useState(0)
  const [mentorOpen, setMentorOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: "assistant", content: "Hi, I'm AcademicLab. Tell me what you're curious about and I'll help you sharpen the question—not take the thinking away from you." }])
  const [chatLoading, setChatLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const ideaRef = useRef<HTMLTextAreaElement>(null)
  const introRef = useRef<HTMLTextAreaElement>(null)
  const hypothesisRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const target = step === 1 ? introRef.current : step === 2 ? hypothesisRef.current : null
    if (target) target.focus({ preventScroll: true })
  }, [step])

  function beginProject() {
    if (projectType === "course" && !selectedCourse) return
    setMode("idea")
    setStep(0)
    window.setTimeout(() => ideaRef.current?.focus(), 350)
  }

  function submitIdea() {
    if (idea.trim().length < 8) { setError("Add a little more detail so we have something meaningful to investigate."); return }
    setError("")
    setStep(1)
  }

  function submitIntroduction() {
    if (introduction.trim().length < 15) { setError("Write a few sentences to explain the context and why this question matters."); return }
    setError("")
    setStep(2)
  }

  async function sendMentorMessage() {
    const message = chatInput.trim()
    if (!message || chatLoading) return
    setChatInput("")
    setChatMessages((current) => [...current, { role: "user", content: message }])
    setChatLoading(true)
    try {
      const response = await fetch("/api/ai/mentor", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `The student is using ResearchFolio. Their research idea is: ${idea || "not chosen yet"}. Their introduction draft is: ${introduction || "not written yet"}. Their hypothesis draft is: ${hypothesis || "not written yet"}. Help them think through the research process using questions and hints. Student message: ${message}`, sessionId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "AcademicLab couldn't respond right now.")
      if (data.sessionId) setSessionId(data.sessionId)
      setChatMessages((current) => [...current, { role: "assistant", content: data.response }])
    } catch (e) {
      setChatMessages((current) => [...current, { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong. Please try again." }])
    } finally { setChatLoading(false) }
  }

  return (
    <main className="research-lab relative min-h-svh overflow-hidden bg-[#071310] text-white">
      <style jsx global>{`
        @keyframes lab-enter { from { opacity:0; transform:translateY(28px) scale(.985); filter:blur(4px); } to { opacity:1; transform:translateY(0) scale(1); filter:blur(0); } }
        @keyframes lab-rise { 0% { opacity:0; transform:translateY(32px); } 100% { opacity:1; transform:translateY(0); } }
        @keyframes lab-pulse { 0%,100% { opacity:.45; transform:scale(1); } 50% { opacity:.85; transform:scale(1.08); } }
        @keyframes lab-orbit { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .lab-enter { animation:lab-enter .75s cubic-bezier(.2,.75,.25,1) both; }
        .lab-rise { animation:lab-rise .65s cubic-bezier(.2,.75,.25,1) both; }
        .lab-glow { animation:lab-pulse 7s ease-in-out infinite; }
        .lab-orbit { animation:lab-orbit 32s linear infinite; }
        .lab-input { width:100%; resize:vertical; color:#f0fdf4; background:rgba(255,255,255,.045); border:1px solid rgba(167,243,208,.2); border-radius:16px; padding:16px 18px; outline:none; line-height:1.7; transition:border-color .2s,background .2s,box-shadow .2s; }
        .lab-input:focus { border-color:rgba(110,231,183,.75); background:rgba(255,255,255,.065); box-shadow:0 0 0 4px rgba(52,211,153,.08); }
        .lab-input::placeholder { color:rgba(226,232,240,.38); }
        .lab-choice { border:1px solid rgba(167,243,208,.14); background:rgba(255,255,255,.035); transition:all .25s ease; }
        .lab-choice:hover { border-color:rgba(110,231,183,.48); transform:translateY(-3px); background:rgba(110,231,183,.06); }
        .lab-choice.selected { border-color:#6ee7b7; background:rgba(52,211,153,.1); box-shadow:0 0 0 1px rgba(110,231,183,.18) inset; }
        .lab-scroll::-webkit-scrollbar { width:5px; } .lab-scroll::-webkit-scrollbar-thumb { background:#ffffff24; border-radius:99px; }
        @media (prefers-reduced-motion: reduce) { .lab-enter,.lab-rise,.lab-glow,.lab-orbit { animation:none !important; } }
      `}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="lab-glow absolute -left-32 -top-36 size-[34rem] rounded-full bg-emerald-500/10 blur-[110px]" />
        <div className="absolute -right-40 top-1/3 size-[38rem] rounded-full bg-teal-400/[0.07] blur-[120px]" />
        <div className="lab-orbit absolute left-1/2 top-[44%] size-[min(88vw,850px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-100/[0.045]" />
        <div className="absolute inset-0 opacity-[.13]" style={{ backgroundImage: "radial-gradient(rgba(167,243,208,.5) .7px, transparent .7px)", backgroundSize: "28px 28px" }} />
      </div>

      <header className="relative z-10 flex h-[76px] items-center justify-between border-b border-white/10 px-5 sm:px-9">
        <button onClick={() => mode === "idea" ? setMode("choose") : router.push("/dashboard/projects")} className="inline-flex items-center gap-3 text-left" aria-label="Back to My Projects">
          <span className="flex size-10 items-center justify-center rounded-xl border border-emerald-200/20 bg-emerald-300/10 text-emerald-200"><FlaskConical className="size-5"/></span>
          <span><span className="block text-sm font-semibold tracking-wide">ResearchFolio</span><span className="block text-[11px] text-emerald-100/50">FolioLabs Research Lab</span></span>
        </button>
        <button onClick={() => router.push("/dashboard/projects")} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-white/75 transition hover:border-emerald-200/40 hover:bg-emerald-200/10 hover:text-white"><ArrowLeft className="size-3.5"/> Exit Research Lab</button>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-76px)] w-full max-w-5xl flex-col px-5 pb-28 pt-9 sm:px-8 sm:pt-14">
        {mode === "choose" ? <section className="lab-enter my-auto">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-300/10 text-emerald-200 shadow-[0_0_65px_rgba(16,185,129,.13)]"><Sparkles className="size-7"/></div>
            <p className="text-xs font-semibold uppercase tracking-[.28em] text-emerald-200/70">A space for questions that matter</p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">Every discovery begins<br className="hidden sm:block"/> with a <span className="text-emerald-200">why.</span></h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-300/70 sm:text-base">Choose how you want to begin. There is no perfect starting point—just a question you are willing to explore.</p>
          </div>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
            <button onClick={() => { setProjectType("independent"); setSelectedCourse("") }} className={`lab-choice rounded-2xl p-5 text-left ${projectType === "independent" ? "selected" : ""}`}>
              <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200"><Lightbulb className="size-5"/></span><span className="mt-4 block text-lg font-semibold">Independent project</span><span className="mt-2 block text-sm leading-6 text-slate-300/65">Start with your own curiosity, idea, or real-world problem.</span><span className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-200">Start from scratch <ChevronRight className="size-4"/></span>
            </button>
            <button onClick={() => setProjectType("course")} className={`lab-choice rounded-2xl p-5 text-left ${projectType === "course" ? "selected" : ""}`}>
              <span className="flex size-11 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><GraduationCap className="size-5"/></span><span className="mt-4 block text-lg font-semibold">University course</span><span className="mt-2 block text-sm leading-6 text-slate-300/65">Shape a research project around a course you are taking.</span><span className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-200">Choose a course <ChevronRight className="size-4"/></span>
            </button>
          </div>
          {projectType === "course" && <div className="lab-rise mx-auto mt-4 max-w-3xl rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><BookOpen className="size-4 text-emerald-200"/> Choose a course</div><div className="grid gap-2 sm:grid-cols-2">{courses.map((course) => <button key={course.id} onClick={() => setSelectedCourse(course.id)} className={`rounded-xl border p-3 text-left transition ${selectedCourse === course.id ? "border-emerald-200/70 bg-emerald-300/10" : "border-white/10 hover:border-white/25"}`}><span className="flex items-start justify-between gap-2 text-sm font-medium">{course.title}{selectedCourse === course.id && <Check className="size-4 shrink-0 text-emerald-200"/>}</span><span className="mt-1 block text-xs leading-5 text-slate-300/55">{course.detail}</span><span className="mt-2 block text-[10px] uppercase tracking-wider text-emerald-200/70">{course.tag}</span></button>)}</div></div>}
          <div className="mt-7 flex justify-center"><button onClick={beginProject} disabled={projectType === "course" && !selectedCourse} className="inline-flex h-12 items-center gap-2 rounded-full bg-emerald-200 px-6 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40">Enter the lab <ArrowRight className="size-4"/></button></div>
        </section> : <section className="mx-auto my-auto w-full max-w-3xl">
          <div className="lab-enter mb-8 text-center" key="idea-heading">
            <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-300/10 text-emerald-200"><Lightbulb className="size-5"/></div>
            <p className="text-xs font-semibold uppercase tracking-[.25em] text-emerald-200/70">Step 01 · The spark</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">What are you curious about?</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300/65">Start messy. A problem you noticed, a pattern you can't explain, or something you wish you understood better.</p>
            {projectType === "course" && <p className="mt-3 text-xs text-emerald-100/60">Course: {courses.find((course) => course.id === selectedCourse)?.title}</p>}
          </div>
          <div className="lab-enter rounded-3xl border border-emerald-100/15 bg-white/[0.035] p-4 shadow-2xl shadow-black/20 sm:p-6">
            <label htmlFor="research-idea" className="mb-3 block text-sm font-medium text-white/85">Your research idea</label>
            <textarea ref={ideaRef} id="research-idea" className="lab-input min-h-36" placeholder="I've been wondering why… / I noticed that… / What if we could…" value={idea} onChange={(event) => { setIdea(event.target.value); setError("") }} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-400/60">A rough idea is enough to begin.</span><button onClick={submitIdea} className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-200 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100">Shape this idea <ArrowRight className="size-4"/></button></div>
          </div>
          {step >= 1 && <div className="lab-rise mt-7" key="introduction-field"><div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl border border-emerald-200/20 bg-emerald-300/10 text-sm font-semibold text-emerald-200">02</span><div><p className="text-xs uppercase tracking-[.2em] text-emerald-200/70">Introduction</p><h2 className="mt-1 text-xl font-semibold">Set the scene.</h2></div></div><p className="mb-4 max-w-2xl text-sm leading-6 text-slate-300/65">What is the context? What do people already know, and what makes this question worth exploring?</p><textarea ref={introRef} className="lab-input min-h-36" placeholder="Introduce the topic, context, and why it matters…" value={introduction} onChange={(event) => { setIntroduction(event.target.value); setError("") }}/><div className="mt-3 flex justify-end"><button onClick={submitIntroduction} className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200/25 bg-emerald-200/10 px-4 text-sm font-medium text-emerald-100 transition hover:bg-emerald-200/15">Continue to hypothesis <ArrowRight className="size-4"/></button></div></div>}
          {step >= 2 && <div className="lab-rise mt-8" key="hypothesis-field"><div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl border border-emerald-200/20 bg-emerald-300/10 text-sm font-semibold text-emerald-200">03</span><div><p className="text-xs uppercase tracking-[.2em] text-emerald-200/70">Hypothesis</p><h2 className="mt-1 text-xl font-semibold">What do you expect to find?</h2></div></div><p className="mb-4 max-w-2xl text-sm leading-6 text-slate-300/65">Make a testable prediction. What do you think will happen, and what reasoning led you there?</p><textarea ref={hypothesisRef} className="lab-input min-h-32" placeholder="I predict that… because… I could test this by…" value={hypothesis} onChange={(event) => setHypothesis(event.target.value)}/><div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200/15 bg-emerald-200/[0.05] p-4 text-sm text-emerald-50/75"><Sparkles className="size-4 shrink-0 text-emerald-200"/>Nice start. Your research foundation is taking shape. We'll build the next stages after this MVP.</div></div>}
          {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-slate-400/60"><span>ResearchFolio · Your process, made visible</span><span>{step + 1} of 3 steps</span></div>
        </section>}
      </div>

      <button onClick={() => setMentorOpen((open) => !open)} className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-emerald-100/25 bg-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-950 shadow-xl shadow-emerald-950/40 transition hover:-translate-y-0.5 hover:bg-emerald-100"><MessageCircle className="size-4"/> AcademicLab <span className="size-2 rounded-full bg-emerald-600"/></button>
      {mentorOpen && <section className="fixed bottom-[84px] right-4 z-50 flex h-[min(600px,72svh)] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-emerald-100/20 bg-[#0c1b17] shadow-2xl shadow-black/50" aria-label="AcademicLab chat">
        <header className="flex items-center justify-between border-b border-white/10 bg-white/[0.035] p-4"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-emerald-200/10 text-emerald-200"><Sparkles className="size-4"/></span><div><p className="text-sm font-semibold">AcademicLab</p><p className="text-[11px] text-emerald-100/55">Your research thinking partner</p></div></div><button onClick={() => setMentorOpen(false)} className="rounded-lg p-2 text-slate-300/60 hover:bg-white/10 hover:text-white" aria-label="Close AcademicLab"><X className="size-4"/></button></header>
        <div className="lab-scroll flex-1 space-y-3 overflow-y-auto p-3">{chatMessages.map((message, index) => <div key={`${index}-${message.role}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-br-sm bg-emerald-200 text-emerald-950" : "rounded-bl-sm border border-white/10 bg-white/[0.05] text-slate-100/85"}`}>{message.content}</div></div>)}{chatLoading && <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-emerald-100/60">AcademicLab is thinking…</div>}</div>
        <form onSubmit={(event) => { event.preventDefault(); void sendMentorMessage() }} className="flex items-end gap-2 border-t border-white/10 p-3"><textarea aria-label="Message AcademicLab" rows={1} value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMentorMessage() } }} placeholder="Ask about your research…" className="max-h-24 min-h-11 flex-1 resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-400/50 focus:border-emerald-200/40"/><button type="submit" disabled={!chatInput.trim() || chatLoading} className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-200 text-emerald-950 transition hover:bg-emerald-100 disabled:opacity-40" aria-label="Send message"><Send className="size-4"/></button></form>
      </section>}
    </main>
  )
}
