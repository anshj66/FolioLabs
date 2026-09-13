"use client"

import { useState } from "react"
import { Bell, Menu, Search, X } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function DashboardFrame({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-svh w-full overflow-hidden bg-background">
      <div className="hidden w-64 shrink-0 border-r border-border md:block"><Sidebar /></div>
      {open && <div className="fixed inset-0 z-50 md:hidden"><div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" /><div className="absolute left-0 top-0 h-full w-72 border-r border-border bg-sidebar shadow-xl"><button onClick={() => setOpen(false)} className="absolute right-3 top-4 z-10 text-muted-foreground hover:text-foreground" aria-label="Close menu"><X className="size-5" /></button><Sidebar /></div></div>}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-border/80 bg-background/90 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></Button>
          <div className="relative flex max-w-xl flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search projects, people, opportunities..." className="h-10 border-border/60 bg-secondary/35 pl-10" /></div>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications"><Bell className="size-5" /><span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background" /></Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
