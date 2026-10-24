"use client"

import { useEffect, useState } from "react"
import { Coins, Loader2, Sparkles, TrendingUp } from "lucide-react"
import { createPortal } from "react-dom"
type CreditTransaction = {
  id: string
  amount: number
  reason?: string | null
  description?: string | null
  created_at: string
}

type CreditsResponse = {
  balance?: number
  transactions?: CreditTransaction[]
  ledger?: CreditTransaction[]
}

export function MeritCreditsPopover() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [error, setError] = useState("")
    const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])
  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadCredits() {
      setLoading(true)
      setError("")

      try {
        const response = await fetch("/api/merit-credits", {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Unable to load Merit Credits.")
        }

        const data: CreditsResponse = await response.json()

        if (!cancelled) {
          setBalance(data.balance ?? 0)
          setTransactions(data.transactions ?? data.ledger ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong loading your credits."
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadCredits()

    return () => {
      cancelled = true
    }
  }, [open])

  return (
<div className="relative z-[100] shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`Merit Credits: ${balance}`}
        className="group flex h-10 items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] px-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 hover:bg-amber-500/[0.14]"
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
          <Coins className="size-4" />
        </span>

        <span className="text-left">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Merit Credits
          </span>
          <span className="block text-sm font-bold tabular-nums">
            {balance.toLocaleString()}
          </span>
        </span>
        <Sparkles className="size-3.5 text-amber-500 transition-transform group-hover:rotate-12" />
      </button>

{open &&
  mounted &&
  createPortal(
    <>
      {/* Click outside to close */}
      <button
        type="button"
        aria-label="Close Merit Credits"
        className="fixed inset-0 z-[9998] cursor-default bg-transparent"
        onClick={() => setOpen(false)}
      />

      {/* Popover rendered outside the dashboard layout */}
      <section
        role="dialog"
        aria-label="Merit Credits history"
        className="fixed right-6 top-16 z-[9999] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div className="border-b border-border bg-gradient-to-br from-amber-500/10 to-transparent p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4 text-amber-500" />
            Your progress rewards
          </div>

          <p className="mt-3 text-3xl font-bold">
            {balance.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Total Merit Credits
          </p>
        </div>

        <div className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Credit history</h3>

          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading your history…
            </div>
          ) : error ? (
            <p className="py-4 text-sm text-destructive">{error}</p>
          ) : transactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-5 text-center">
              <Coins className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">
                No credits earned yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Eligible project milestones and feedback will appear here.
              </p>
            </div>
          ) : (
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between gap-3 rounded-xl p-3 hover:bg-muted/60"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">
                      {transaction.reason ||
                        transaction.description ||
                        "Merit Credits earned"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {transaction.created_at
                        ? new Date(transaction.created_at).toLocaleDateString()
                        : "Date unavailable"}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-emerald-500">
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Credits reflect eligible activity recorded by FolioLabs.
        </div>
      </section>
    </>,
    document.body
  )}
    </div>
  )
}