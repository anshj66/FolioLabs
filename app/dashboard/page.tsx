import Link from 'next/link'
import { ArrowUpRight, CheckCircle2, Clock3, FileText, FlaskConical, ShieldCheck } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { demoEvidence, demoProjects, demoStats, demoUser } from '@/lib/demo-data'

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tuesday, September 23, 2025</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Good morning, {demoUser.name.split(' ')[0]}.</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Your learning evidence is building momentum. You have one defense to prepare for and three items ready for faculty review.</p>
          </div>
          <Link className={cn(buttonVariants({ variant: 'default' }), 'gap-2')} href="/dashboard/lab">Open Learning Lab <ArrowUpRight className="size-4" /></Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Active projects', demoStats.activeProjects, '2 on track'],
          ['Evidence captured', demoStats.evidenceCount, '+3 this month'],
          ['Authenticity score', `${demoStats.authenticityScore}%`, 'Excellent'],
          ['Portfolio entries', demoStats.portfolioItems, '4 verified'],
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
            <p className="mt-1 text-xs text-primary">{note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-6">
            <div><h2 className="font-semibold text-foreground">Active projects</h2><p className="mt-1 text-sm text-muted-foreground">Your current learning threads</p></div>
            <Link className={buttonVariants({ variant: 'ghost', size: 'sm' })} href="/dashboard/projects">View all</Link>
          </div>
          <div className="flex flex-col">
            {demoProjects.filter((p) => p.status === 'active').map((project) => (
              <div key={project.id} className="flex items-center gap-4 border-b border-border p-6 last:border-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"><FlaskConical className="size-5 text-primary" /></div>
                <div className="min-w-0 flex-1"><p className="truncate font-medium text-foreground">{project.name}</p><p className="mt-1 text-xs text-muted-foreground">{project.category} · {project.collaborators.length + 1} contributors</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${project.progress}%` }} /></div></div>
                <span className="text-sm font-semibold text-foreground">{project.progress}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-6"><h2 className="font-semibold text-foreground">Next up</h2><p className="mt-1 text-sm text-muted-foreground">Keep the evidence loop moving</p></div>
          <div className="flex flex-col gap-5 p-6">
            {[{icon: Clock3, title: 'Prepare project defense', detail: 'Friday · 10:00 AM', href: '/dashboard/defense'}, {icon: FileText, title: 'Add a project reflection', detail: 'Eigenvector Centrality', href: '/dashboard/evidence'}, {icon: ShieldCheck, title: 'Faculty review pending', detail: '3 evidence items', href: '/dashboard/faculty'}].map((item) => <Link href={item.href} key={item.title} className="flex gap-3 rounded-xl p-2 -m-2 hover:bg-secondary/60"><item.icon className="mt-0.5 size-5 text-primary" /><div><p className="text-sm font-medium text-foreground">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div></Link>)}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-6"><div><h2 className="font-semibold text-foreground">Recent evidence</h2><p className="mt-1 text-sm text-muted-foreground">A transparent record of your work</p></div><Link className={buttonVariants({ variant: 'ghost', size: 'sm' })} href="/dashboard/evidence">Open timeline</Link></div>
        <div className="grid gap-4 p-6 sm:grid-cols-3">{demoEvidence.slice(0, 3).map((evidence) => <div key={evidence.id} className="rounded-xl border border-border bg-secondary/30 p-4"><div className="flex items-center justify-between"><span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{evidence.type}</span>{evidence.verified && <CheckCircle2 className="size-4 text-primary" />}</div><p className="mt-4 text-sm font-medium text-foreground">{evidence.title}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{evidence.description}</p></div>)}</div>
      </section>
    </div>
  )
}

