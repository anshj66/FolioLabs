"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ROLES = [
  "Student",
  "Researcher",
  "Teaching Assistant",
  "Professor",
  "Faculty",
  "Mentor",
  "Other",
]

const INTERESTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Artificial Intelligence",
  "Data Science",
  "Robotics",
  "Electronics",
  "Economics",
  "Finance",
  "Business",
  "Psychology",
  "Design",
  "Entrepreneurship",
]

type Profile = {
  full_name: string
  introduction: string
  role: string
  interests: string[]
  is_public: boolean
}

export function ProfileSettings() {
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    introduction: "",
    role: "Student",
    interests: [],
    is_public: false,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile")

        if (!response.ok) {
          throw new Error("Failed to load profile")
        }

        const data = await response.json()

        if (data.profile) {
          setProfile({
            full_name: data.profile.full_name ?? "",
            introduction: data.profile.introduction ?? "",
            role: data.profile.role ?? "Student",
            interests: data.profile.interests ?? [],
            is_public: data.profile.is_public ?? false,
          })
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  function toggleInterest(interest: string) {
    setProfile((current) => {
      const alreadySelected = current.interests.includes(interest)

      if (alreadySelected) {
        return {
          ...current,
          interests: current.interests.filter(
            (item) => item !== interest
          ),
        }
      }

      if (current.interests.length >= 10) {
        return current
      }

      return {
        ...current,
        interests: [...current.interests, interest],
      }
    })
  }

  async function saveProfile() {
    setSaving(true)
    setMessage("")

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          introduction: profile.introduction,
          role: profile.role,
          interests: profile.interests,
          is_public: profile.is_public,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile")
      }

      setProfile({
        full_name: data.profile.full_name ?? "",
        introduction: data.profile.introduction ?? "",
        role: data.profile.role ?? "Student",
        interests: data.profile.interests ?? [],
        is_public: data.profile.is_public ?? false,
      })

      setMessage("Profile saved successfully.")
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save profile."
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading profile...
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Name</Label>

        <Input
          id="full_name"
          value={profile.full_name}
          onChange={(e) =>
            setProfile({
              ...profile,
              full_name: e.target.value,
            })
          }
          placeholder="Your name"
          maxLength={100}
        />
      </div>

      {/* Introduction */}
      <div className="space-y-2">
        <Label htmlFor="introduction">
          Introduction
        </Label>

        <textarea
          id="introduction"
          value={profile.introduction}
          onChange={(e) =>
            setProfile({
              ...profile,
              introduction: e.target.value,
            })
          }
          placeholder="Tell the community a little about yourself..."
          maxLength={500}
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
        />

        <p className="text-xs text-muted-foreground">
          {profile.introduction.length}/500
        </p>
      </div>

      {/* Role */}
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>

        <select
          id="role"
          value={profile.role}
          onChange={(e) =>
            setProfile({
              ...profile,
              role: e.target.value,
            })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {/* Interests */}
      <div className="space-y-3">
        <div>
          <Label>Interests Area</Label>

          <p className="mt-1 text-xs text-muted-foreground">
            Select up to 10 areas you're interested in.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => {
            const selected =
              profile.interests.includes(interest)

            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                {interest}
              </button>
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          {profile.interests.length}/10 selected
        </p>
      </div>

{/* Public profile */}
<div className="rounded-xl border border-border p-4">
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium">
        Display profile publicly
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        Allow other FolioLabs users to discover your profile
        in the Community.
      </p>
    </div>

<label className="relative inline-flex cursor-pointer items-center">
  <input
    type="checkbox"
    className="peer sr-only"
    checked={profile.is_public}
    onChange={(e) =>
      setProfile({
        ...profile,
        is_public: e.target.checked,
      })
    }
  />

  <div
    className="
      relative
      h-6
      w-11
      rounded-full
      bg-muted
      transition-colors
      peer-checked:bg-primary
      after:absolute
      after:left-1
      after:top-1
      after:size-4
      after:rounded-full
      after:bg-white
      after:transition-transform
      peer-checked:after:translate-x-5
    "
  />
</label>
  </div>

  <div className="mt-3">
    {profile.is_public ? (
      <p className="text-xs text-primary">
        ✓ Your profile is visible in the Community.
      </p>
    ) : (
      <p className="text-xs text-muted-foreground">
        Your profile is currently private.
      </p>
    )}
  </div>
</div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button
          onClick={saveProfile}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save profile"}
        </Button>

        {message && (
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}