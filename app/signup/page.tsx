"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  const [submitted, setSubmitted] = useState(false)
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12"><div className="w-full max-w-md"><Logo className="mb-10" /><div className="rounded-2xl border border-border bg-card p-6 sm:p-8"><p className="text-sm font-medium uppercase tracking-[.16em] text-primary">Early access</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Save your place.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">We will let you know when FolioLabs opens its doors.</p>{submitted ? <div className="mt-8 rounded-xl border border-primary/30 bg-primary/10 p-4"><div className="flex items-center gap-2 text-sm font-medium text-primary"><CheckCircle2 className="size-4" /> You are on the list.</div><p className="mt-2 text-sm text-muted-foreground">We will send updates to your inbox as the workspace gets ready.</p></div> : <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4"><div className="grid gap-2"><Label htmlFor="signup-email">Email address</Label><Input id="signup-email" type="email" placeholder="you@university.edu" required /></div><Button type="submit" className="mt-2">Sign me up <ArrowRight data-icon="inline-end" /></Button></form>}<p className="mt-6 text-center text-sm text-muted-foreground"><Link href="/" className="text-primary hover:underline">Back to coming soon</Link> · <Link href="/" className="text-primary hover:underline">Sign in</Link></p></div></div></main>
}