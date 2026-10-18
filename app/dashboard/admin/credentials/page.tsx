import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { CredentialRequests } from "@/components/credential-requests"

export default async function CredentialRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) redirect("/dashboard")
  return <div className="mx-auto flex max-w-6xl flex-col gap-6"><div><p className="text-sm font-medium uppercase tracking-[.18em] text-primary">Administration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Credential verification</h1><p className="mt-2 text-muted-foreground">Review submitted academic or professional documents. Documents are provided through time-limited private links.</p></div><CredentialRequests /></div>
}
