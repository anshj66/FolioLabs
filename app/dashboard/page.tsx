import Link from 'next/link'
import { ArrowUpRight, CheckCircle2, Clock3, FileText, FlaskConical, ShieldCheck, Users } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { demoEvidence, demoProjects, demoStats } from '@/lib/demo-data'
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { createServiceClient } from "@/lib/supabase/service"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "there"

  const firstName = fullName.split(" ")[0]

  // Admin sees platform operations only; ordinary members keep the existing dashboard.
  if (isAdminEmail(user?.email)) {
    let studentCount = 0
    let projectCount = 0
    let opportunityCount = 0
    let credentialRequestCount = 0
    try {
      const admin = createServiceClient()
      let page = 1
      while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
        if (error) throw error
        const users = data.users ?? []
        studentCount += users.filter((u) => (u.email ?? "").toLowerCase() !== "anshj6627@gmail.com").length
        if (users.length < 1000) break
        page += 1
      }
      const [projects, opportunities, credentials] = await Promise.all([
        admin.from("projects").select("id", { count: "exact", head: true }),
        admin.from("opportunities").select("id", { count: "exact", head: true }),
        admin.from("credential_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ])
      projectCount = projects.count ?? 0
      opportunityCount = opportunities.count ?? 0
      credentialRequestCount = credentials.count ?? 0
    } catch (error) {
      console.error("Admin overview stats error:", error)
    }
    const stats = [
      { label: "Students on platform", value: studentCount, detail: "Registered member accounts", href: "/dashboard/community", icon: Users },
      { label: "Student projects", value: projectCount, detail: "Projects recorded in FolioLabs", href: "/dashboard/projects", icon: FlaskConical },
      { label: "Opportunities", value: opportunityCount, detail: "Draft and published listings", href: "/dashboard/opportunities", icon: ArrowUpRight },
      { label: "Credential requests", value: credentialRequestCount, detail: "Awaiting admin review", href: "/dashboard/admin/credentials", icon: ShieldCheck },
    ]
    return <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8"><p className="text-sm font-medium uppercase tracking-[.18em] text-primary">FolioLabs administration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Platform overview</h1><p className="mt-2 text-sm text-muted-foreground">A focused overview of platform growth and member credential reviews.</p></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((item) => <Link key={item.label} href={item.href} className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{item.label}</p><item.icon className="size-5 text-primary" /></div><p className="mt-4 text-3xl font-semibold tracking-tight">{item.value}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></Link>)}</section>
    </div>
  }
const currentDate = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
}).format(new Date())
  // ...existing return below
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{currentDate}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Good morning, {firstName}.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Your learning evidence is building momentum. You have one defense to prepare for and three items ready for faculty review.</p>
          </div>
          <Link className={cn(buttonVariants({ variant: 'default' }), 'gap-2')} href="/dashboard/lab">Open Learning Lab <ArrowUpRight className="size-4" /></Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[{ label: 'Opportunities', detail: '12 curated matches', href: '/dashboard/opportunities', icon: ArrowUpRight }, { label: 'Greenhouse Engine', detail: '82 momentum score', href: '/dashboard/academiclab', icon: FlaskConical }, { label: 'Faculty', detail: '3 reviews pending', href: '/dashboard/faculty', icon: ShieldCheck }, { label: 'Settings', detail: 'Workspace preferences', href: '/dashboard/settings', icon: CheckCircle2 }].map((feature) => <Link key={feature.label} href={feature.href} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"><div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><feature.icon className="size-4" /></div><div className="min-w-0"><p className="text-sm font-medium text-foreground">{feature.label}</p><p className="mt-1 truncate text-xs text-muted-foreground">{feature.detail}</p></div><ArrowUpRight className="ml-auto size-4 text-muted-foreground" /></Link>)}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          ['Active projects', demoStats.activeProjects, '2 on track'],
          ['Evidence captured', demoStats.evidenceCount, '+3 this month'],
          ['Authenticity score', `${demoStats.authenticityScore}%`, 'Excellent'],
          ['Portfolio entries', demoStats.portfolioItems, '4 verified'],
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm shadow-black/10 transition-transform hover:-translate-y-0.5 sm:p-5">
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

