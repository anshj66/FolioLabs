import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Please sign in to view Merit Credits." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ balance: 0, transactions: [], admin: true })
  try {
    const service = createServiceClient()
    const { data, error: queryError } = await service.from("merit_credit_ledger").select("id,amount,event_type,source_type,source_id,idempotency_key,description,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100)
    if (queryError) throw queryError
    const transactions = data ?? []
    const balance = transactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
    return NextResponse.json({ balance, transactions })
  } catch (error) {
    console.error("Merit Credits GET failed:", error)
    return NextResponse.json({ error: "Could not load Merit Credits. Apply the FolioLabs platform migration." }, { status: 500 })
  }
}
