import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { ProfileSettings } from "@/components/profile-settings"
import { CredentialVerification } from "@/components/credential-verification"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/signin")
  if (isAdminEmail(user.email)) redirect("/dashboard")
  const { data: profile } = await supabase.from("profiles").select("verification_status").eq("id", user.id).maybeSingle()
  if (profile?.verification_status === "approved") redirect("/dashboard")
  return <main className="mx-auto flex min-h-[calc(100svh-3rem)] max-w-3xl flex-col gap-6 py-5"><header className="rounded-2xl border border-border bg-card p-6 sm:p-8"><p className="text-sm font-medium uppercase tracking-[.18em] text-primary">Welcome to FolioLabs</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Set up your academic identity</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Complete your profile and request academic-role verification. Course, research-review, and other role-specific features unlock after approval. Your existing projects and account remain associated with your login.</p></header><section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><h2 className="text-lg font-semibold">1. Your profile</h2><p className="mb-5 mt-1 text-sm text-muted-foreground">Use the name you want displayed across your projects, feedback, and portfolio.</p><ProfileSettings /></section><section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><h2 className="text-lg font-semibold">2. Verify your academic role</h2><p className="mb-5 mt-1 text-sm text-muted-foreground">Choose your role, provide your institution, and upload supporting evidence. Undergraduate students must select their current year.</p><CredentialVerification /></section><p className="text-xs leading-5 text-muted-foreground">Documents are stored privately while a decision is pending. FolioLabs attempts to delete document bytes after approval or rejection; if deletion fails, it must be retried before the document can be considered deleted. The verification record and decision metadata may be retained for audit purposes.</p></main>
}
