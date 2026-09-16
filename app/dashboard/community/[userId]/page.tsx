"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Profile = {
  id: string
  full_name: string | null
  introduction: string | null
  role: string
  interests: string[]
}

type Stats = {
  followers: number
  following: number
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({
    followers: 0,
    following: 0,
  })
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        setError("")

        const { userId } = await params

        const [
          profileResponse,
          statsResponse,
          followResponse,
        ] = await Promise.all([
          fetch(`/api/profile/${userId}`),
          fetch(`/api/community/stats/${userId}`),
          fetch(`/api/community/follow/status?ids=${userId}`),
        ])

        const profileData = await profileResponse.json()
        const statsData = await statsResponse.json()
        const followData = await followResponse.json()

        if (!profileResponse.ok) {
          throw new Error(
            profileData.error || "Profile not found"
          )
        }

        setProfile(profileData.profile)

        setStats({
          followers: statsData.followers ?? 0,
          following: statsData.following ?? 0,
        })

        setIsFollowing(
          followData.following?.[userId] ?? false
        )
      } catch (error) {
        console.error("Profile page error:", error)

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load profile"
        )
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [params])

  async function handleFollow() {
    if (!profile) return

    setFollowLoading(true)

    try {
      if (isFollowing) {
        const response = await fetch(
          `/api/community/follow?followingId=${profile.id}`,
          {
            method: "DELETE",
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to unfollow"
          )
        }

        setIsFollowing(false)

        setStats((current) => ({
          ...current,
          followers: Math.max(
            0,
            current.followers - 1
          ),
        }))
      } else {
        const response = await fetch(
          "/api/community/follow",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: profile.id,
            }),
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to follow"
          )
        }

        setIsFollowing(true)

        setStats((current) => ({
          ...current,
          followers: current.followers + 1,
        }))
      }
    } catch (error) {
      console.error("Follow error:", error)

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update follow status"
      )
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-sm text-muted-foreground">
          Loading profile...
        </p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Link href="/dashboard/community">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 size-4" />
            Back to Community
          </Button>
        </Link>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {error || "Profile not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href="/dashboard/community">
        <Button variant="ghost">
          <ArrowLeft className="mr-2 size-4" />
          Back to Community
        </Button>
      </Link>

      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                {(profile.full_name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h1 className="text-2xl font-semibold">
                  {profile.full_name || "Unnamed User"}
                </h1>

                <p className="mt-1 text-muted-foreground">
                  {profile.role}
                </p>

                <div className="mt-4 flex gap-6 text-sm">
                  <div>
                    <span className="font-semibold">
                      {stats.followers}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      followers
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold">
                      {stats.following}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      following
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleFollow}
              disabled={followLoading}
              variant={isFollowing ? "outline" : "default"}
            >
              {followLoading
                ? "..."
                : isFollowing
                  ? "Following"
                  : "Follow"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {profile.introduction && (
        <Card>
          <CardHeader>
            <CardTitle>Introduction</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm leading-7 text-muted-foreground">
              {profile.introduction}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Interests</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            {profile.interests?.map((interest) => (
              <span
                key={interest}
                className="rounded-full border px-3 py-1.5 text-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}