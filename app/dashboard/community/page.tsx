"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type Profile = {
  id: string
  full_name: string | null
  role: string
  interests: string[]
}

export default function CommunityPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadProfiles(searchValue = "") {
    try {
      setLoading(true)
      setError("")

      const query = searchValue.trim()
        ? `?search=${encodeURIComponent(searchValue.trim())}`
        : ""

      const response = await fetch(
        `/api/community/profiles${query}`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load community"
        )
      }

      setProfiles(data.profiles ?? [])
    } catch (error) {
      console.error("Community error:", error)

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load community"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadProfiles(search)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
  <div>
    <div className="flex items-center gap-3">
      <Users className="size-6 text-primary" />

      <div>
        <p className="text-sm font-medium uppercase tracking-[.18em] text-primary">
          Connect
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Community
        </h1>
      </div>
    </div>

    <p className="mt-3 max-w-2xl text-muted-foreground">
      Discover students, researchers, faculty, and
      other people building interesting things on
      FolioLabs.
    </p>
  </div>

  <Link href="/dashboard/community/me">
    <Button variant="outline">
      My Profile
    </Button>
  </Link>
</div>
</div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="flex gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <Button type="submit">
          Search
        </Button>
      </form>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <p className="text-sm text-muted-foreground">
          Loading community...
        </p>
      )}

      {/* Empty */}
      {!loading && !error && profiles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-4 size-10 text-muted-foreground" />

            <h2 className="text-lg font-semibold">
              No public profiles found
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Try another search or be the first person to make
              your profile public.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Profiles */}
      {!loading && profiles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/dashboard/community/${profile.id}`}
              className="block"
            >
              <Card className="h-full transition hover:border-primary/50 hover:shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                      {(profile.full_name || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">
                        {profile.full_name || "Unnamed User"}
                      </h2>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {profile.role}
                      </p>
                    </div>
                  </div>

                  {/* Interests */}
                  {profile.interests?.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {profile.interests
                        .slice(0, 5)
                        .map((interest) => (
                          <span
                            key={interest}
                            className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground"
                          >
                            {interest}
                          </span>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}