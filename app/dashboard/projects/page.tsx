"use client"

import Link from "next/link"
import { ArrowUpRight, Code2, FileText, FlaskConical, Sparkles, LockKeyhole } from "lucide-react"

const folios = [
  { name: "ResearchFolio", eyebrow: "THINK · QUESTION · DISCOVER", description: "Turn a curious idea into a structured research project. Build your introduction, hypothesis, and research direction one step at a time.", href: "/dashboard/projects/researchfolio", cta: "Enter ResearchFolio", icon: FlaskConical, style: "research", available: true },
  { name: "CodeFolio", eyebrow: "BUILD · TEST · SHIP", description: "Capture your software journey: experiments, iterations, code decisions, and the thinking behind every release.", href: "#codefolio", cta: "Explore CodeFolio", icon: Code2, style: "code", available: false },
  { name: "CreateFolio", eyebrow: "DESIGN · MAKE · SHARE", description: "Bring creative work together with prototypes, feedback, process notes, and the story behind what you create.", href: "#createfolio", cta: "Explore CreateFolio", icon: FileText, style: "create", available: false },
]

export default function ProjectsPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 pb-10">
      <style jsx>{`
        @keyframes card-rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floaty { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-9px) rotate(3deg); } }
        .folio-choice { animation: card-rise .65s both; }
        .folio-choice:nth-child(2) { animation-delay: .12s; } .folio-choice:nth-child(3) { animation-delay: .24s; }
        .folio-art { isolation: isolate; }
        .folio-art:before { content: ''; position:absolute; inset:0; opacity:.9; z-index:-2; }
        .folio-art-research:before { background: radial-gradient(circle at 50% 50%, #2dd4bf55, transparent 35%), radial-gradient(circle at 20% 20%, #38bdf833, transparent 35%), linear-gradient(135deg,#102d31,#10201f 55%,#1c2440); }
        .folio-art-code:before { background: radial-gradient(circle at 65% 30%, #a78bfa55, transparent 32%), linear-gradient(135deg,#21163b,#111a32 65%,#172e39); }
        .folio-art-create:before { background: radial-gradient(circle at 40% 40%, #fb718555, transparent 35%), linear-gradient(135deg,#3c1e32,#24203c 60%,#392b24); }
        .folio-orbit { position:absolute; width:180px; height:180px; border:1px solid #ffffff30; border-radius:50%; animation:floaty 7s ease-in-out infinite; }
        .orbit-two { width:230px; height:230px; animation-delay:-2s; border-style:dashed; }
        .folio-art-core { display:flex; width:94px; height:94px; align-items:center; justify-content:center; border-radius:28px; color:#d1fae5; background:#ffffff12; border:1px solid #ffffff45; box-shadow:0 18px 55px #0005; backdrop-filter:blur(12px); animation:floaty 5s ease-in-out infinite; }
        .art-dot { position:absolute; width:9px; height:9px; border-radius:99px; background:#99f6e4; box-shadow:0 0 20px #5eead4; }
        .dot-a { top:27%; left:25%; } .dot-b { right:23%; top:35%; } .dot-c { bottom:24%; left:37%; }
        .art-line { position:absolute; height:1px; width:68px; background:linear-gradient(90deg,transparent,#99f6e4,transparent); transform:rotate(35deg); }
        .line-a { top:36%; left:28%; } .line-b { bottom:31%; right:24%; transform:rotate(-30deg); }
        .code-window { width:190px; padding:14px; border:1px solid #ffffff35; border-radius:14px; background:#111827aa; transform:rotate(-5deg); box-shadow:0 20px 50px #0005; }
        .code-bar { height:5px; border-radius:9px; margin:7px 0; background:linear-gradient(90deg,#a78bfa,#38bdf8); opacity:.8; }
        .code-bar:nth-child(3) { width:72%; } .code-bar:nth-child(4) { width:54%; } .code-bar:nth-child(5) { width:83%; }
        .create-shape { position:absolute; width:105px; height:130px; border-radius:24px; border:1px solid #ffffff55; background:linear-gradient(140deg,#fb718566,#c084fc22); transform:rotate(20deg); box-shadow:0 20px 45px #0005; }
        .create-shape-two { width:80px; height:100px; transform:rotate(-24deg) translate(-40px,8px); background:linear-gradient(140deg,#fbbf2455,#fb718522); }
        @media (prefers-reduced-motion: reduce) { .folio-choice,.folio-orbit,.folio-art-core { animation:none !important; } }
      `}</style>
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-12 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-primary"><Sparkles className="size-3.5" /> YOUR CREATION SPACE</div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">What will you make <span className="text-primary">observable?</span></h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Choose a folio for the kind of work you want to do. Capture not just the final result, but the thinking and process that got you there.</p>
        </div>
      </section>
      <section className="grid gap-5 lg:grid-cols-3">
        {folios.map((folio) => {
          const Icon = folio.icon
          return <article key={folio.name} className="folio-choice group flex min-h-[440px] flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl">
            <div className={`folio-art folio-art-${folio.style} relative flex h-52 items-center justify-center overflow-hidden`}>
              <div className="folio-orbit"/><div className="folio-orbit orbit-two"/>
              {folio.style === "research" && <><div className="folio-art-core"><Icon className="size-12" strokeWidth={1.25}/></div><span className="art-dot dot-a"/><span className="art-dot dot-b"/><span className="art-dot dot-c"/><div className="art-line line-a"/><div className="art-line line-b"/></>}
              {folio.style === "code" && <div className="code-window"><div className="flex gap-1.5 pb-2"><i className="size-2 rounded-full bg-rose-300"/><i className="size-2 rounded-full bg-amber-300"/><i className="size-2 rounded-full bg-emerald-300"/></div><div className="code-bar"/><div className="code-bar"/><div className="code-bar"/><div className="code-bar"/></div>}
              {folio.style === "create" && <><div className="create-shape create-shape-two"/><div className="create-shape"/><div className="folio-art-core relative"><Icon className="size-10" strokeWidth={1.25}/></div></>}
              <span className="absolute bottom-4 left-5 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.18em] text-white/80">{folio.eyebrow}</span>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-start justify-between gap-3"><h2 className="text-2xl font-semibold tracking-tight">{folio.name}</h2>{folio.available ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">Available now</span> : <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground"><LockKeyhole className="size-3"/> Coming soon</span>}</div>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{folio.description}</p>
              {folio.available ? <Link href={folio.href} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110">{folio.cta}<ArrowUpRight className="size-4"/></Link> : <button type="button" disabled className="mt-6 inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 text-sm font-semibold text-muted-foreground">{folio.cta}<LockKeyhole className="size-4"/></button>}
            </div>
          </article>
        })}
      </section>
    </div>
  )
}
