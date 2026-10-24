"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  MessageCircle, Briefcase, FlaskConical, LayoutDashboard, Award, BookOpen,
  Settings, Shield, Target, Sprout, BrainCircuit, ClipboardCheck,
  MessageSquare, Users, LogOut, Search, Globe2, FolderKanban, GraduationCap,
  type LucideIcon,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { User } from "@supabase/supabase-js"
import { isAdminEmail } from "@/lib/admin"

type NavItem = { label: string; href: string; icon: LucideIcon; group: string }
const memberNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, group: "Learn & Build" },
  { label: "My Projects", href: "/dashboard/projects", icon: Briefcase, group: "Learn & Build" },
  { label: "Learning Lab", href: "/dashboard/lab", icon: FlaskConical, group: "Learn & Build" },
  { label: "AI Mentor", href: "/dashboard/mentor", icon: BrainCircuit, group: "Learn & Build" },
  { label: "Assessments", href: "/dashboard/assessment", icon: ClipboardCheck, group: "Learn & Build" },
  { label: "Greenhouse Engine", href: "/dashboard/academiclab", icon: Sprout, group: "Learn & Build" },
  { label: "Opportunities", href: "/dashboard/opportunities", icon: Target, group: "Prove & Launch" },
  { label: "Courses", href: "/dashboard/courses", icon: GraduationCap, group: "Learn & Build" },
  { label: "Defense", href: "/dashboard/defense", icon: Shield, group: "Prove & Launch" },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: Award, group: "Prove & Launch" },
  { label: "Research", href: "/dashboard/research", icon: Search, group: "Prove & Launch" },
  { label: "Showcase", href: "/dashboard/showcase", icon: Globe2, group: "Prove & Launch" },
  { label: "Feedback", href: "/dashboard/feedback", icon: MessageSquare, group: "Collaborate & Validate" },
  { label: "Community Review", href: "/dashboard/community-review", icon: BookOpen, group: "Collaborate & Validate" },
  { label: "Faculty Review", href: "/dashboard/faculty", icon: Award, group: "Collaborate & Validate" },
  { label: "Evidence", href: "/dashboard/evidence", icon: BookOpen, group: "Collaborate & Validate" },
  { label: "Community", href: "/dashboard/community", icon: Users, group: "Collaborate & Validate" },
  { label: "Messages", href: "/dashboard/messages", icon: MessageCircle, group: "Collaborate & Validate" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, group: "Account" },
]
const professorNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, group: "Research" },
  { label: "Courses & Students", href: "/dashboard/courses", icon: GraduationCap, group: "Teaching" },
  { label: "Assessments", href: "/dashboard/assessment", icon: ClipboardCheck, group: "Teaching" },
  { label: "Learning Lab", href: "/dashboard/lab", icon: FlaskConical, group: "Research" },
  { label: "Research Insights", href: "/dashboard/feedback", icon: MessageSquare, group: "Research" },
  { label: "Opportunities", href: "/dashboard/opportunities", icon: Target, group: "Community" },
  { label: "Messages", href: "/dashboard/messages", icon: MessageCircle, group: "Community" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, group: "Account" },
]
const adminNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, group: "Administration" },
  { label: "Credential Verification Requests", href: "/dashboard/admin/credentials", icon: Shield, group: "Administration" },
  { label: "Users and Projects", href: "/dashboard/admin/students-projects", icon: FolderKanban, group: "Administration" },
  { label: "Opportunities", href: "/dashboard/opportunities", icon: Target, group: "Administration" },
]

export function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = isAdminEmail(user?.email)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [profileName, setProfileName] = useState("")
  const [academicRole, setAcademicRole] = useState("")
  const [roleLoaded, setRoleLoaded] = useState(false)

  useEffect(() => {
    if (!user || isAdmin) { setRoleLoaded(true); return }
    let mounted = true
    fetch("/api/profile", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(data => { if (mounted && typeof data?.profile?.full_name === "string") setProfileName(data.profile.full_name.trim()); if (mounted && typeof data?.profile?.academic_role === "string") setAcademicRole(data.profile.academic_role); if (mounted) setRoleLoaded(true) }).catch(() => { if (mounted) setRoleLoaded(true) })
    return () => { mounted = false }
  }, [isAdmin, user])

  useEffect(() => {
    if (isAdmin) return
    let mounted = true
    async function loadUnreadCount() {
      try {
        const response = await fetch("/api/chat/unread", { cache: "no-store" })
        if (!response.ok) return
        const data = await response.json()
        if (mounted) setUnreadMessages(data.unreadCount ?? 0)
      } catch (error) { console.error("Unread message count error:", error) }
    }
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 2500)
    window.addEventListener("messages-read", loadUnreadCount)
    return () => { mounted = false; clearInterval(interval); window.removeEventListener("messages-read", loadUnreadCount) }
  }, [isAdmin])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/welcome")
    router.refresh()
  }

  const isProfessor = academicRole === "professor"
  const items = isAdmin ? adminNav : !roleLoaded ? [] : isProfessor ? professorNav : memberNav
  const groups = [...new Set(items.map(item => item.group))]

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar">
      <div className="flex h-16 items-center px-6"><Logo /></div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {groups.map(group => (
          <div key={group} className="flex flex-col gap-1">
            <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70 first:pt-0">{group}</p>
            {items.filter(item => item.group === group).map(item => {
              const active = item.href === "/dashboard" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
              const isMessages = item.href === "/dashboard/messages"
              return <Link key={item.label} href={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground")}>
                <item.icon className={cn("size-4", active && "text-primary")} />
                <span className="flex-1">{item.label}</span>
                {isMessages && unreadMessages > 0 && <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">{unreadMessages > 99 ? "99+" : unreadMessages}</span>}
              </Link>
            })}
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-3 border-t border-border p-4">
        <Avatar className="size-9"><AvatarFallback className="bg-primary/15 text-sm font-medium text-primary">{(profileName || user?.user_metadata?.full_name || user?.email || "U").split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{profileName || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}</p><p className="truncate text-xs text-muted-foreground">{isAdmin ? "Admin" : user?.email || "Student"}</p></div>
        <button type="button" onClick={handleLogout} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Log out" title="Log out"><LogOut className="size-4" /></button>
      </div>
    </aside>
  )
}
