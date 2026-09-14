"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CreateAccountPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [otp, setOtp] = useState("")
  const [showOtp, setShowOtp] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

async function handleCreateAccount(e: React.FormEvent) {
  e.preventDefault()

  setError("")
  setMessage("")

  if (!name.trim()) {
    setError("Please enter your full name.")
    return
  }

  if (password.length < 8) {
    setError("Password must be at least 8 characters.")
    return
  }

  if (password !== confirmPassword) {
    setError("Passwords do not match.")
    return
  }

  setLoading(true)

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: name.trim(),
        },
      },
    })

    console.log("Supabase signup:", data)

    if (error) {
      console.error("Supabase signup error:", error)
      setError(error.message)
      return
    }

    /*
     * If email confirmation is enabled, Supabase normally
     * returns a user but no session.
     *
     * We show the OTP screen regardless of whether a session
     * was returned because this page is specifically designed
     * around email verification.
     */
    setShowOtp(true)
    setOtp("")
    setMessage(`Verification code sent to ${email.trim()}.`)
  } catch (err) {
    console.error(err)

    setError(
      err instanceof Error
        ? err.message
        : "Unable to create your account."
    )
  } finally {
    setLoading(false)
  }
}
async function handleVerifyOtp(e: React.FormEvent) {
  e.preventDefault()

  if (otp.length !== 8) {
    setError("Please enter the 8-digit verification code.")
    return
  }

  setError("")
  setMessage("")
  setLoading(true)

  try {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp,
      type: "email",
    })

    if (error) {
      console.error("OTP verification error:", error)
      setError(error.message)
      return
    }

    router.push("/dashboard")
    router.refresh()
  } catch (err) {
    console.error(err)

    setError(
      err instanceof Error
        ? err.message
        : "Unable to verify your email."
    )
  } finally {
    setLoading(false)
  }
}
 async function handleResendOtp() {
  setError("")
  setMessage("")
  setLoading(true)

  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
    })

    if (error) {
      console.error("Resend OTP error:", error)
      setError(error.message)
      return
    }

    setMessage(`A new verification code was sent to ${email}.`)
  } catch (err) {
    console.error(err)

    setError(
      err instanceof Error
        ? err.message
        : "Unable to resend the verification code."
    )
  } finally {
    setLoading(false)
  }
}
  return (
    <main className="flex min-h-svh w-full bg-background">
      {/* LEFT SIDE */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-10" />

          {!showOtp ? (
            <>
              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-pretty text-2xl font-semibold tracking-tight text-foreground">
                  Create your account
                </h1>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Start building your verified academic portfolio.
                </p>
              </div>

              {/* SIGNUP FORM */}
              <form
                onSubmit={handleCreateAccount}
                className="flex flex-col gap-4"
              >
                {/* NAME */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Full name</Label>

                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      required
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@university.edu"
                      required
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Password</Label>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      required
                      minLength={8}
                      className="h-11 px-10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirm-password">
                    Confirm password
                  </Label>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      placeholder="Confirm your password"
                      required
                      minLength={8}
                      className="h-11 px-10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ERROR */}
                {error && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}

                {/* CREATE ACCOUNT */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 h-11 w-full gap-2 font-medium"
                >
                  {loading
                    ? "Creating account..."
                    : "Create account"}

                  {!loading && (
                    <ArrowRight className="size-4" />
                  )}
                </Button>
              </form>

              {/* SIGN IN */}
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* OTP HEADING */}
              <div className="mb-8">
                <h1 className="text-pretty text-2xl font-semibold tracking-tight text-foreground">
                  Verify your email
                </h1>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  We sent a 8-digit verification code to{" "}
                  <span className="font-medium text-foreground">
                    {email}
                  </span>
                  .
                </p>
              </div>

              {/* OTP FORM */}
              <form
                onSubmit={handleVerifyOtp}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="otp">
                    Verification code
                  </Label>

                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 8)
                      )
                    }
                    placeholder="12345678"
                    required
                    className="h-12 text-center text-lg tracking-[0.4em]"
                  />
                </div>

                {message && (
                  <p className="text-sm text-primary">
                    {message}
                  </p>
                )}

                {error && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading || otp.length !== 8}
                  className="h-11 w-full gap-2 font-medium"
                >
                  {loading
                    ? "Verifying..."
                    : "Verify email"}

                  {!loading && (
                    <ArrowRight className="size-4" />
                  )}
                </Button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowOtp(false)
                    setOtp("")
                    setError("")
                    setMessage("")
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Use a different email
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="relative hidden flex-1 overflow-hidden border-l border-border bg-sidebar lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col justify-between p-14">
          <Logo />

          <div className="max-w-md">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              Your learning, with a trail
            </div>

            <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground">
              Build the evidence behind your ambitions.
            </h1>

            <p className="mt-4 leading-relaxed text-muted-foreground">
              Create one connected workspace for your
              projects, reflections, skills, and verified
              academic progress.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Built for thoughtful work and credible progress.
          </p>
        </div>
      </div>
    </main>
  )
}