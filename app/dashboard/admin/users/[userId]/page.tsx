import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ShieldCheck, UserRound } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isAdminEmail } from "@/lib/admin"
import { DeleteAccount } from "@/components/delete-account"

export const dynamic = "force-dynamic"

export default async function AdminUserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  // 1. Verify the current session.
  const session = await createClient()

  const {
    data: { user },
    error: sessionError,
  } = await session.auth.getUser()

  console.log("[Admin profile] Session check:", {
    authenticated: Boolean(user),
    email: user?.email ?? null,
    error: sessionError?.message ?? null,
    isAdmin: isAdminEmail(user?.email),
  })

  if (!user) {
    redirect("/login")
  }

  // 2. Only the configured admin can access this page.
if (!isAdminEmail(user.email)) {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold text-red-500">
        Admin authorization failed
      </h1>
      <p className="mt-3 text-sm">
        Authenticated email: {user.email ?? "No email returned"}
      </p>
      <p className="mt-2 text-sm">
        Expected admin email: anshj6627@gmail.com
      </p>
    </main>
  )
}

  console.log("[Admin profile] Admin authorization passed.")

  // 3. Get the selected user's ID.
  const { userId } = await params

  if (!userId) {
    notFound()
  }

  const service = createServiceClient()

  // 4. Load the user's profile, authentication record, and credential history.
  const [
    { data: profile, error: profileError },
    { data: authResult, error: authError },
    { data: submissions, error: submissionsError },
  ] = await Promise.all([
    service
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle(),

    service.auth.admin.getUserById(userId),

    service
      .from("credential_submissions")
      .select(
        "id,credential_type,status,created_at,reviewed_at,admin_note"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  if (profileError) {
    console.error(
      "[Admin profile] Profile query failed:",
      profileError.message
    )
    throw new Error("Unable to load this user's profile.")
  }

  if (authError) {
    console.error(
      "[Admin profile] Authentication record lookup failed:",
      authError.message
    )
  }

  if (submissionsError) {
    console.error(
      "[Admin profile] Credential history lookup failed:",
      submissionsError.message
    )
  }

  const member = authResult?.user ?? null

  console.log("[Admin profile] User lookup:", {
    userId,
    profileFound: Boolean(profile),
    authUserFound: Boolean(member),
  })

  // The user may have a profile, an authentication record, or both.
  if (!profile && !member) {
    notFound()
  }

  // 5. Format values for display.
  const label = (value: unknown): string =>
    typeof value === "string" && value.trim()
      ? value
      : "Not provided"

  const academicRole =
    profile?.academic_role === "undergraduate"
      ? `Undergraduate${
          profile.academic_year
            ? ` · Year ${profile.academic_year}`
            : ""
        }`
      : profile?.academic_role === "phd"
        ? "PhD"
        : profile?.academic_role === "masters"
          ? "Masters"
          : profile?.academic_role === "professor"
            ? "Professor"
            : label(profile?.role)

  const displayName =
    label(profile?.full_name) === "Not provided"
      ? member?.email ?? "User profile"
      : profile.full_name

  const details: [string, string][] = [
    ["Academic role", academicRole],
    ["Verification", label(profile?.verification_status)],
    ["Institution", label(profile?.institution)],
    ["Course / subject", label(profile?.field_of_study)],
    [
      "Year",
      profile?.academic_year
        ? String(profile.academic_year)
        : "Not applicable",
    ],
    [
      "Account created",
      member?.created_at
        ? new Date(member.created_at).toLocaleString()
        : "Unavailable",
    ],
    [
      "Profile visibility",
      profile?.is_public ? "Public" : "Private",
    ],
    [
      "Last sign in",
      member?.last_sign_in_at
        ? new Date(member.last_sign_in_at).toLocaleString()
        : "No sign-in recorded",
    ],
  ]

  // 6. Render the profile.
  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/dashboard/admin/students-projects"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to users
      </Link>

      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserRound className="size-7" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">
                {displayName}
              </h1>

              {profile?.verification_status === "approved" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                  <ShieldCheck className="size-3.5" />
                  Verified
                </span>
              )}
            </div>

            <p className="mt-2 break-all text-sm text-muted-foreground">
              {member?.email ?? "Email unavailable"}
            </p>

            <p className="mt-3 inline-flex rounded-full border border-border px-3 py-1.5 text-sm">
              {academicRole}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {details.map(([title, value]) => (
          <div
            key={title}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="mt-2 break-words text-sm font-medium">
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <h2 className="font-semibold">Credential history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Private administrative view. Uploaded credential files are
            not exposed here.
          </p>
        </div>

        {(submissions ?? []).length > 0 ? (
          <div className="divide-y divide-border">
            {submissions!.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-medium">
                    {item.credential_type}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted{" "}
                    {new Date(item.created_at).toLocaleString()}
                  </p>

                  {item.admin_note && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.admin_note}
                    </p>
                  )}
                </div>

                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-5 text-sm text-muted-foreground">
            No credential submissions recorded.
          </p>
        )}
      </section>

      {member?.id &&
        member.email?.toLowerCase() !== "anshj6627@gmail.com" && (
          <DeleteAccount
            targetUserId={member.id}
            adminMode
          />
        )}
    </main>
  )
}