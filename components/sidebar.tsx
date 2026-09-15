"use client"
import { createClient } from "@/lib/supabase/client"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Briefcase,
  FlaskConical,
  LayoutDashboard,
  Award,
  BookOpen,
  Settings,
  Shield,
  Target,
  Sprout,
  Sparkles,
  BrainCircuit,
  ClipboardCheck,
  MessageSquare,
  Users,
  LogOut,
  Search,
  Presentation,
  Globe2,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { User } from "@supabase/supabase-js"

const nav: { label: string; href: string; icon: LucideIcon; group: string }[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, group: "Learn & Build" },
  { label: "My Projects", href: "/dashboard/projects", icon: Briefcase, group: "Learn & Build" },
  { label: "Learning Lab", href: "/dashboard/lab", icon: FlaskConical, group: "Learn & Build" },
  { label: "AI Mentor", href: "/dashboard/mentor", icon: BrainCircuit, group: "Learn & Build" },
  { label: "Assessments", href: "/dashboard/assessment", icon: ClipboardCheck, group: "Learn & Build" },
  { label: "Opportunities", href: "/dashboard/opportunities", icon: Target, group: "Prove & Launch" },
  { label: "Greenhouse Engine", href: "/dashboard/academiclab", icon: Sprout, group: "Learn & Build" },
  { label: "Feedback", href: "/dashboard/feedback", icon: MessageSquare, group: "Collaborate & Validate" },
  { label: "Peer Review", href: "/dashboard/peer-review", icon: Users, group: "Collaborate & Validate" },
  { label: "Faculty Review", href: "/dashboard/faculty", icon: Award, group: "Collaborate & Validate" },
  { label: "Evidence", href: "/dashboard/evidence", icon: BookOpen, group: "Collaborate & Validate" },
  { label: "Defense", href: "/dashboard/defense", icon: Shield, group: "Prove & Launch" },
  { label: "Community", href: "/dashboard/community", icon: Users, group: "Collaborate & Validate" },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: Award, group: "Prove & Launch" },
  { label: "Research", href: "/dashboard/research", icon: Search, group: "Prove & Launch" },
  { label: "Showcase", href: "/dashboard/showcase", icon: Globe2, group: "Prove & Launch" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, group: "Account" },
]

export function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/welcome")
    router.refresh()
  }

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar">
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {["Learn & Build", "Collaborate & Validate", "Prove & Launch", "Account"].map((group) => (
          <div key={group} className="flex flex-col gap-1">
            <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70 first:pt-0">{group}</p>
            {nav.filter((item) => item.group === group).map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return <Link key={item.label} href={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground")}><item.icon className={cn("size-4", active && "text-primary")} />{item.label}</Link>
            })}
          </div>
        ))}
      </nav>

      <div className="m-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles className="size-4 text-primary" />
          Upgrade to Pro
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Unlock unlimited verifications and advanced analytics.
        </p>
      </div>

      <div className="flex items-center gap-3 border-t border-border p-4">
        <Avatar className="size-9">
        <AvatarFallback className="bg-primary/15 text-sm font-medium text-primary">
          {(
            user?.user_metadata?.full_name ||
            user?.email ||
            "U"
          )
            .split(" ")
            .map((part: string) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
{user?.user_metadata?.full_name ||
  user?.email?.split("@")[0] ||
  "User"}          </p>
          <p className="truncate text-xs text-muted-foreground">{user?.email || "Student"}</p>
        </div>
<button
  type="button"
  onClick={handleLogout}
  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
  aria-label="Log out"
  title="Log out"
>
  <LogOut className="size-4" />
</button>
      </div>
    </aside>
  )
}
