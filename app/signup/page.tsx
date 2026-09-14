"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.")
      return
    }

    setLoading(true)
    setErrorMessage("")

    try {
      const { error } = await supabase
        .from("waitlist")
        .insert({
          email: cleanEmail,
        })

      if (error) {
        // Email already exists in the waitlist
        if (error.code === "23505") {
          setSubmitted(true)
          return
        }

console.error("Waitlist signup error:", {
  message: error?.message,
  code: error?.code,
  details: error?.details,
  hint: error?.hint,
})
        setErrorMessage(
          error.message || "Something went wrong. Please try again."
        )
        return
      }

      setSubmitted(true)
    } catch (error) {
      console.error("Unexpected waitlist error:", error)
      setErrorMessage("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <Logo className="mb-10" />

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[.16em] text-primary">
            Early access
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Save your place.
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            We will let you know when FolioLabs opens its doors.
          </p>

          {submitted ? (
            <div className="mt-8 rounded-xl border border-primary/30 bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <CheckCircle2 className="size-4" />
                You are on the list.
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                We will send updates to your inbox as the workspace gets
                ready.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="signup-email">Email address</Label>

                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {errorMessage && (
                <p className="text-sm text-destructive">
                  {errorMessage}
                </p>
              )}

              <Button
                type="submit"
                className="mt-2"
                disabled={loading}
              >
                {loading ? "Joining..." : "Sign me up"}

                {!loading && (
                  <ArrowRight data-icon="inline-end" />
                )}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/"
              className="text-primary hover:underline"
            >
              Back to coming soon
            </Link>

            {" · "}

            <Link
              href="/login"
              className="text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}