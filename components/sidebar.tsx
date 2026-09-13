"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Briefcase,
  FlaskConical,
  LayoutDashboard,
  Award,
  BookOpen,
  Settings,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { demoUser } from "@/lib/demo-data"

const nav: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects", icon: Briefcase },
  { label: "Lab", href: "/dashboard/lab", icon: FlaskConical },
  { label: "Evidence", href: "/dashboard/evidence", icon: BookOpen },
  { label: "Defense", href: "/dashboard/defense", icon: Shield },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: Award },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar">
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
        {nav.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <item.icon
                className={cn("size-4.5", active && "text-primary")}
              />
              {item.label}
            </Link>
          )
        })}
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
            AM
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {demoUser.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{demoUser.institution} · Student</p>
        </div>
      </div>
    </aside>
  )
}
