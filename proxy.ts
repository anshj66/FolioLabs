import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

const ADMIN_EMAIL = "anshj6627@gmail.com"
const adminAllowed = new Set(["/dashboard", "/dashboard/admin/credentials", "/dashboard/admin/students-projects", "/dashboard/opportunities"])

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  if (!user) {
    const signIn = new URL("/signin", request.url)
    signIn.searchParams.set("next", pathname)
    return NextResponse.redirect(signIn)
  }

  const isAdmin = (user.email ?? "").toLowerCase() === ADMIN_EMAIL
  if (isAdmin && !adminAllowed.has(pathname)) return NextResponse.redirect(new URL("/dashboard", request.url))
  if (!isAdmin && pathname.startsWith("/dashboard/admin")) return NextResponse.redirect(new URL("/dashboard", request.url))
  if (!isAdmin) {
    const { data: profile } = await supabase.from("profiles").select("verification_status,academic_role").eq("id", user.id).maybeSingle()
    const isOnboardingRoute = pathname === "/dashboard/onboarding" || pathname === "/dashboard/settings"
    if (profile?.verification_status !== "approved" && !isOnboardingRoute) return NextResponse.redirect(new URL("/dashboard/onboarding", request.url))
    if (profile?.verification_status === "approved" && pathname === "/dashboard/onboarding") return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  return response
}

export const config = { matcher: ["/dashboard/:path*"] }
