import { DashboardFrame } from "@/components/dashboard-frame"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <DashboardFrame user={user}>
      {children}
    </DashboardFrame>
  )
}