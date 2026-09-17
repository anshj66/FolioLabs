"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Lock,
  MessageCircle,
  Users,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Profile = {
  id: string
  full_name: string | null
  introduction: string | null
  role: string
  interests: string[]
  is_public: boolean
}

type Stats = {
  followers: number
  following: number
}

type ConnectionProfile = {
  id: string
  full_name: string | null
  role: string
  interests: string[]
  is_public: boolean
}

type ConnectionTab = "followers" | "following"

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const [profile, setProfile] =
    useState<Profile | null>(null)

  const [stats, setStats] = useState<Stats>({
    followers: 0,
    following: 0,
  })

  const [isFollowing, setIsFollowing] =
    useState(false)

  const [isOwnProfile, setIsOwnProfile] =
    useState(false)

  const [canViewConnections, setCanViewConnections] =
    useState(false)

  const [connectionsLoading, setConnectionsLoading] =
    useState(false)

  const [followers, setFollowers] =
    useState<ConnectionProfile[]>([])

  const [following, setFollowing] =
    useState<ConnectionProfile[]>([])

  const [connectionTab, setConnectionTab] =
    useState<ConnectionTab>("followers")

  const [showConnections, setShowConnections] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [followLoading, setFollowLoading] =
    useState(false)

  const [messageLoading, setMessageLoading] =
    useState(false)

  const [error, setError] =
    useState("")

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
          connectionsResponse,
        ] = await Promise.all([
          fetch(`/api/profile/${userId}`),
          fetch(`/api/community/stats/${userId}`),
          fetch(
            `/api/community/follow/status?ids=${userId}`
          ),
          fetch(
            `/api/community/connections/${userId}`
          ),
        ])

        const profileData =
          await profileResponse.json()

        const statsData =
          await statsResponse.json()

        const followData =
          await followResponse.json()

        if (!profileResponse.ok) {
          throw new Error(
            profileData.error ||
              "Profile not found"
          )
        }

        setProfile(profileData.profile)

        setIsOwnProfile(
          profileData.isOwnProfile === true
        )

        setStats({
          followers: statsData.followers ?? 0,
          following: statsData.following ?? 0,
        })

        setIsFollowing(
          followData.following?.[userId] ??
            false
        )

        /*
         * 200 = connections can be viewed.
         * 403 = not mutually connected.
         */
        if (connectionsResponse.ok) {
          const connectionsData =
            await connectionsResponse.json()

          setCanViewConnections(
            connectionsData.canView === true
          )

          setFollowers(
            connectionsData.followers ?? []
          )

          setFollowing(
            connectionsData.following ?? []
          )
        } else {
          setCanViewConnections(false)
          setFollowers([])
          setFollowing([])
        }
      } catch (error) {
        console.error(
          "Profile page error:",
          error
        )

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
    if (!profile || isOwnProfile) return

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
            data.error ||
              "Failed to unfollow"
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

        /*
         * If this was a mutual connection,
         * removing our follow immediately locks
         * the follower/following lists again.
         */
        setCanViewConnections(false)
        setShowConnections(false)
      } else {
        const response = await fetch(
          "/api/community/follow",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              userId: profile.id,
            }),
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to follow"
          )
        }

        setIsFollowing(true)

        setStats((current) => ({
          ...current,
          followers:
            current.followers + 1,
        }))
      }
    } catch (error) {
      console.error(
        "Follow error:",
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update follow status"
      )
    } finally {
      setFollowLoading(false)
    }
  }

  async function handleMessage() {
    if (!profile || isOwnProfile) return

    setMessageLoading(true)

    try {
      const response = await fetch(
        "/api/chat/conversations",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            userId: profile.id,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "You need a follow connection to message this person."
        )
      }

      window.location.href =
        `/dashboard/messages?userId=${profile.id}`
    } catch (error) {
      console.error(
        "Message error:",
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : "Failed to open conversation"
      )
    } finally {
      setMessageLoading(false)
    }
  }

  async function openConnections(
    tab: ConnectionTab
  ) {
    if (!profile) return

    if (!canViewConnections) {
      return
    }

    setConnectionTab(tab)
    setShowConnections(true)

    /*
     * Refresh from server whenever the modal opens.
     */
    setConnectionsLoading(true)

    try {
      const response = await fetch(
        `/api/community/connections/${profile.id}`
      )

      const data = await response.json()

      if (!response.ok) {
        setCanViewConnections(false)
        setShowConnections(false)

        throw new Error(
          data.error ||
            "Connections are not available."
        )
      }

      setFollowers(data.followers ?? [])
      setFollowing(data.following ?? [])
    } catch (error) {
      console.error(
        "Connections error:",
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load connections"
      )
    } finally {
      setConnectionsLoading(false)
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

  if (error && !profile) {
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
              {error}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) return null

  const displayedConnections =
    connectionTab === "followers"
      ? followers
      : following

  return (
    <>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Link href="/dashboard/community">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 size-4" />
            Back to Community
          </Button>
        </Link>

        {error && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                {error}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Profile */}
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
                    {profile.full_name ||
                      "Unnamed User"}
                  </h1>

                  <p className="mt-1 text-muted-foreground">
                    {profile.role}
                  </p>

                  {/* Stats */}
                  <div className="mt-4 flex gap-6 text-sm">
                    <button
                      type="button"
                      onClick={() =>
                        openConnections(
                          "followers"
                        )
                      }
                      className={
                        canViewConnections
                          ? "text-left transition hover:opacity-70"
                          : "cursor-not-allowed text-left"
                      }
                    >
                      <span className="font-semibold">
                        {stats.followers}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        followers
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openConnections(
                          "following"
                        )
                      }
                      className={
                        canViewConnections
                          ? "text-left transition hover:opacity-70"
                          : "cursor-not-allowed text-left"
                      }
                    >
                      <span className="font-semibold">
                        {stats.following}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        following
                      </span>
                    </button>
                  </div>

                  {/* Connection status */}
                  {!isOwnProfile &&
                    !canViewConnections && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="size-3" />
                        Followers and following are
                        visible after you follow each
                        other.
                      </div>
                    )}

                  {isOwnProfile && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      This is your profile.
                    </p>
                  )}
                </div>
              </div>

              {!isOwnProfile && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleMessage}
                    disabled={messageLoading}
                    variant="outline"
                  >
                    <MessageCircle className="mr-2 size-4" />
                    {messageLoading
                      ? "Opening..."
                      : "Message"}
                  </Button>

                  <Button
                    onClick={handleFollow}
                    disabled={followLoading}
                    variant={
                      isFollowing
                        ? "outline"
                        : "default"
                    }
                  >
                    {followLoading
                      ? "..."
                      : isFollowing
                        ? "Following"
                        : "Follow"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Introduction */}
        {profile.introduction && (
          <Card>
            <CardHeader>
              <CardTitle>
                Introduction
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">
                {profile.introduction}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
          </CardHeader>

          <CardContent>
            {profile.interests?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(
                  (interest) => (
                    <span
                      key={interest}
                      className="rounded-full border px-3 py-1.5 text-sm"
                    >
                      {interest}
                    </span>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No interests added yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connections Modal */}
      {showConnections && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {profile.full_name ||
                    "User"}
                </h2>

                <p className="text-sm text-muted-foreground">
                  Connections
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setShowConnections(false)
                }
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 border-b">
              <button
                type="button"
                onClick={() =>
                  setConnectionTab(
                    "followers"
                  )
                }
                className={`border-b-2 px-4 py-3 text-sm font-medium ${
                  connectionTab ===
                  "followers"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                Followers {stats.followers}
              </button>

              <button
                type="button"
                onClick={() =>
                  setConnectionTab(
                    "following"
                  )
                }
                className={`border-b-2 px-4 py-3 text-sm font-medium ${
                  connectionTab ===
                  "following"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                Following {stats.following}
              </button>
            </div>

            {/* List */}
            <div className="max-h-[60vh] overflow-y-auto p-3">
              {connectionsLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : displayedConnections.length ===
                0 ? (
                <div className="p-8 text-center">
                  <Users className="mx-auto mb-3 size-8 text-muted-foreground" />

                  <p className="text-sm text-muted-foreground">
                    No{" "}
                    {connectionTab ===
                    "followers"
                      ? "followers"
                      : "following"}{" "}
                    yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {displayedConnections.map(
                    (person) => (
                      <Link
                        key={person.id}
                        href={`/dashboard/community/${person.id}`}
                        onClick={() =>
                          setShowConnections(
                            false
                          )
                        }
                        className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-muted"
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                          {(
                            person.full_name ||
                            "U"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {person.full_name ||
                              "Unnamed User"}
                          </p>

                          <p className="truncate text-xs text-muted-foreground">
                            {person.role}
                          </p>
                        </div>
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}