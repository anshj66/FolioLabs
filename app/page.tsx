"use client"

import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  FileText,
  FlaskConical,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"

const workflow = [
  { number: "01", title: "Build", text: "Turn questions into focused projects and experiments.", icon: FlaskConical },
  { number: "02", title: "Capture", text: "Keep the artifacts, decisions, and reflections that show your thinking.", icon: FileText },
  { number: "03", title: "Defend", text: "Explain your choices and demonstrate what you understand.", icon: MessageSquare },
  { number: "04", title: "Verify", text: "Invite mentors and peers to validate the work behind your claims.", icon: ShieldCheck },
]

const features = [
  { icon: FlaskConical, title: "A lab for real work", text: "Prototype, test ideas, and keep your research process connected to the final result." },
  { icon: FileText, title: "Evidence with context", text: "Artifacts become meaningful when your reasoning, revisions, and outcomes travel with them." },
  { icon: ShieldCheck, title: "Trust you can explain", text: "Build a transparent record of verification instead of a black-box score or empty badge." },
]

export default function HomePage() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })

  return (
    <main className="min-h-svh overflow-hidden bg-background">
      <nav className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Logo />
          <div className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" onClick={() => scrollTo("why")}>Why FolioLabs</Button>
            <Button variant="ghost" size="sm" onClick={() => scrollTo("workflow")}>How it works</Button>
            <Button variant="ghost" size="sm" onClick={() => scrollTo("features")}>Features</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign in</Button>
            <Button size="sm" onClick={() => scrollTo("start")}>Start building <ArrowRight data-icon="inline-end" /></Button>
          </div>
        </div>
      </nav>

      <section className="relative px-5 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:56px_56px]" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-0 size-[620px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1fr_.9fr] lg:gap-20">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" /> The evidence layer for ambitious learners
            </div>
            <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-.045em] text-foreground sm:text-6xl lg:text-7xl">
              Make the work behind your work visible.
            </h1>
            <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
              FolioLabs helps you turn projects, experiments, and reflection into a portfolio with substance — one that shows how you think, not just what you finished.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => scrollTo("start")}>Build your portfolio <ArrowRight data-icon="inline-end" /></Button>
              <Button size="lg" variant="outline" onClick={() => scrollTo("workflow")}>See the workflow</Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
              {["No empty badges", "Built for reflection", "Human-verified"].map((item) => <span key={item} className="inline-flex items-center gap-2"><Check className="size-3.5 text-primary" />{item}</span>)}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[500px]">
            <div className="absolute -inset-5 rounded-[2rem] bg-primary/10 blur-2xl" aria-hidden="true" />
            <div className="relative rounded-[1.5rem] border border-border bg-card/90 p-3 shadow-2xl shadow-black/20">
              <div className="rounded-xl border border-border bg-background p-5 sm:p-6">
                <div className="flex items-center justify-between border-b border-border pb-5">
                  <div><p className="text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">Portfolio health</p><p className="mt-2 text-3xl font-semibold tracking-tight">82<span className="text-base text-muted-foreground">/100</span></p></div>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary"><TrendingUp className="size-5" /></div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[{ value: "06", label: "projects" }, { value: "24", label: "evidence" }, { value: "04", label: "verified" }].map((stat) => <div key={stat.label} className="rounded-xl bg-secondary/60 p-3"><p className="text-xl font-semibold">{stat.value}</p><p className="mt-1 text-[11px] text-muted-foreground">{stat.label}</p></div>)}
                </div>
                <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary"><ShieldCheck className="size-4" /></div><div><p className="text-sm font-medium">Evidence verified</p><p className="text-xs text-muted-foreground">Faculty review · 2 days ago</p></div><CheckCircle2 className="ml-auto size-4 text-primary" /></div>
                </div>
                <div className="mt-6"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-medium uppercase tracking-[.15em] text-muted-foreground">Momentum</p><span className="text-xs text-primary">+18% this month</span></div><div className="flex h-20 items-end gap-2">{[28, 42, 34, 58, 48, 72, 64, 88, 76, 96].map((height, index) => <div key={index} className="flex-1 rounded-t bg-primary/70" style={{ height: `${height}%`, opacity: .35 + index * .06 }} />)}</div></div>
              </div>
              <div className="flex items-center gap-2 px-2 pb-1 pt-4 text-xs text-muted-foreground"><div className="size-2 rounded-full bg-primary" /> Your learning, with a trail others can trust</div>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="border-y border-border/70 bg-card/30 px-5 py-10 lg:px-8"><div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3"><div><p className="text-3xl font-semibold">24k+</p><p className="mt-1 text-sm text-muted-foreground">learners building in public</p></div><div><p className="text-3xl font-semibold">91%</p><p className="mt-1 text-sm text-muted-foreground">of evidence reviewed by a human</p></div><div><p className="text-3xl font-semibold">4.8/5</p><p className="mt-1 text-sm text-muted-foreground">reported confidence in their work</p></div></div></section>

      <section id="workflow" className="px-5 py-24 lg:px-8"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-sm font-medium uppercase tracking-[.18em] text-primary">The FolioLabs loop</p><h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">A better way to show how you got there.</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">The strongest portfolios are not a gallery of finished screens. They are a clear, credible trail from question to insight.</p></div><div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{workflow.map((item) => <div key={item.number} className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"><div className="flex items-center justify-between"><item.icon className="size-6 text-primary" /><span className="font-mono text-xs text-muted-foreground">{item.number}</span></div><h3 className="mt-12 text-lg font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p></div>)}</div></div></section>

      <section id="features" className="bg-card/30 px-5 py-24 lg:px-8"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-medium uppercase tracking-[.18em] text-primary">Designed for depth</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Your process deserves a home.</h2></div><p className="max-w-md text-sm leading-6 text-muted-foreground">Everything is designed to help you make better decisions, tell a clearer story, and invite the right people into your learning.</p></div><div className="mt-14 grid gap-5 lg:grid-cols-3">{features.map((feature) => <div key={feature.title} className="rounded-2xl border border-border bg-background p-7"><div className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary"><feature.icon className="size-5" /></div><h3 className="mt-8 text-lg font-semibold">{feature.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.text}</p><div className="mt-7 h-px bg-border" /><p className="mt-4 text-xs font-medium text-primary">Explore the workspace <ArrowRight className="ml-1 inline size-3.5" /></p></div>)}</div></div></section>

      <section id="start" className="px-5 py-24 lg:px-8"><div className="mx-auto grid max-w-7xl items-center gap-10 rounded-[1.75rem] border border-primary/25 bg-primary/10 p-8 sm:p-12 lg:grid-cols-[1fr_auto]"><div><p className="text-sm font-medium uppercase tracking-[.18em] text-primary">Start with one honest project</p><h2 className="mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl">Your next opportunity should see more than the final file.</h2><p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">Bring the questions, iterations, and decisions with you. That is where the real signal lives.</p></div><Button size="lg" className="w-full sm:w-auto">Open your workspace <ArrowRight data-icon="inline-end" /></Button></div></section>

      <footer className="border-t border-border px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><Logo /><div className="flex items-center gap-5 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><Users className="size-3.5" /> Built for thoughtful work</span><span>© 2026 FolioLabs</span></div></div></footer>
    </main>
  )
}
