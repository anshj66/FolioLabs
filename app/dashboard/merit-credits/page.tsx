"use client"

import { useCallback, useEffect, useState } from "react"
import { Award, RefreshCw, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

type Transaction = { id: string; amount: number; event_type: string; description: string; created_at: string }
export default function MeritCreditsPage() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(async () => {
    setBusy(true); setError("")
    try {
      const response = await fetch("/api/merit-credits", { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load Merit Credits.")
      setBalance(data.balance ?? 0); setTransactions(data.transactions ?? [])
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load Merit Credits.") }
    finally { setBusy(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  return <div className="mx-auto flex max-w-4xl flex-col gap-7"><header><p className="text-sm font-medium uppercase tracking-[.18em] text-primary">Academic contribution</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Merit Credits</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Credits recognize finalized research progress and useful, eligible feedback. They are not money and do not imply a subscription or redemption value.</p></header><section className="rounded-2xl border border-border bg-card p-6"><div className="flex items-center gap-4"><div className="rounded-xl bg-primary/10 p-3 text-primary"><Award className="size-7"/></div><div><p className="text-sm text-muted-foreground">Current balance</p><p className="mt-1 text-4xl font-semibold tabular-nums">{busy ? "—" : balance}</p></div><Button variant="ghost" size="sm" className="ml-auto" onClick={() => void load()}><RefreshCw className="mr-2 size-3.5"/>Refresh</Button></div><div className="mt-5 flex gap-3 rounded-xl border border-border p-4"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary"/><p className="text-sm leading-6 text-muted-foreground">Rewards are recorded in a server-controlled ledger with unique source keys to prevent duplicate awards. Saving a draft or repeatedly refreshing a page does not earn credits.</p></div></section><section><h2 className="mb-3 text-lg font-semibold">Recent transactions</h2>{error ? <p role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">{error}</p> : transactions.length ? <div className="divide-y divide-border rounded-2xl border border-border bg-card">{transactions.map(item => <article key={item.id} className="flex items-center gap-4 p-4"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.description}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{item.event_type.replaceAll("_", " ")} · {new Date(item.created_at).toLocaleString()}</p></div><p className={`text-sm font-semibold tabular-nums ${item.amount > 0 ? "text-primary" : "text-destructive"}`}>{item.amount > 0 ? "+" : ""}{item.amount}</p></article>)}</div> : <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">{busy ? "Loading your ledger…" : "No Merit Credit transactions yet. Finalized milestones and valid feedback can earn credits once the corresponding reward workflow is enabled."}</p>}</section></div>
}
