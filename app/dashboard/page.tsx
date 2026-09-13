import Link from "next/link"
import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  ChevronRight,
  Citrus,
  Clock,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"
import { CircularProgress } from "@/components/circular-progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  activeProjects,
  activity,
  opportunities,
  stats,
  user,
} from "@/lib/data"

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* Welcome card */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Welcome back, {user.name.split(" ")[0]}
            </p>
            <h1 className="mt-1 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Here&apos;s your research at a glance
            </h1>
            <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
              You have {stats.activeProjects} active projects and{" "}
              {opportunities.length} opportunities closing soon. Keep the
              momentum going.
            </p>
          </div>
          <div className="flex gap-3">
            <Button className="gap-2">
              New Project
              <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stat row */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active projects */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15">
              <Briefcase className="size-5 text-primary" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <TrendingUp className="size-3" />
              +2 this week
            </span>
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
            {stats.activeProjects}
          </p>
          <p className="text-sm text-muted-foreground">Active projects</p>
        </div>

        {/* Authenticity score */}
        <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-6">
          <div className="flex w-full items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Authenticity Score
            </span>
          </div>
          <div className="my-2">
            <CircularProgress
              value={stats.authenticityScore}
              sublabel="Excellent"
            />
          </div>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Verified across {activeProjects.length} collaborations
          </p>
        </div>

        {/* Fruits balance */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15">
              <Citrus className="size-5 text-primary" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <TrendingUp className="size-3" />+{stats.fruitsThisMonth} mo
            </span>
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
            {stats.fruitsBalance.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">Fruits balance</p>
          <Button
            variant="outline"
            className="mt-4 h-9 w-full border-border bg-secondary/40 text-sm hover:bg-secondary"
          >
            Redeem Fruits
          </Button>
        </div>
      </section>

      {/* Projects + activity */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming opportunities */}
        <div className="rounded-2xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-base font-semibold text-foreground">
              Upcoming Opportunities
            </h2>
            <Link
              href="/dashboard/opportunities"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all
              <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="flex flex-col">
            {opportunities.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-4 border-t border-border px-6 py-4 transition-colors hover:bg-secondary/30"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/50">
                  <Calendar className="size-4.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {o.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {o.org} · {o.type}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-foreground">
                    {o.amount}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    o.urgent
                      ? "bg-destructive/15 text-destructive"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {o.deadline}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-base font-semibold text-foreground">
              Recent Activity
            </h2>
          </div>
          <div className="flex flex-col gap-1 px-6 pb-6">
            {activity.map((a) => (
              <div key={a.id} className="flex gap-3 py-2.5">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-secondary text-xs font-medium text-foreground">
                    {a.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {a.actor}
                    </span>{" "}
                    {a.action}{" "}
                    <span className="font-medium text-foreground">
                      {a.target}
                    </span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {a.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active projects widget */}
      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-base font-semibold text-foreground">
            Active Projects
          </h2>
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all
            <ChevronRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden border-t border-border bg-border sm:grid-cols-2">
          {activeProjects.map((p) => (
            <div key={p.id} className="bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  Due {p.due}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{p.members} collaborators</span>
                <span className="font-medium text-foreground">
                  {p.progress}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
