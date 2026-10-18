"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const INTERESTS = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Artificial Intelligence", "Data Science", "Robotics", "Electronics", "Economics", "Finance", "Business", "Psychology", "Design", "Entrepreneurship"]
type Profile = { full_name: string; introduction: string; role: string; interests: string[]; is_public: boolean }

export function ProfileSettings({ isAdmin = false }: { isAdmin?: boolean }) {
  const [profile, setProfile] = useState<Profile>({ full_name: "", introduction: "", role: "", interests: [], is_public: false })
  const [approvedRole, setApprovedRole] = useState<string | null>(null)
  const [credentialStatus, setCredentialStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" })
        if (!response.ok) throw new Error("Failed to load profile")
        const data = await response.json()
        if (data.profile) setProfile({ full_name: data.profile.full_name ?? "", introduction: data.profile.introduction ?? "", role: data.profile.role ?? "", interests: data.profile.interests ?? [], is_public: data.profile.is_public ?? false })
        if (!isAdmin) {
          const credentialResponse = await fetch("/api/credentials/submit", { cache: "no-store" })
          if (credentialResponse.ok) {
            const credentialData = await credentialResponse.json()
            const submission = credentialData.submission
            setCredentialStatus(submission?.status ?? null)
            setApprovedRole(submission?.status === "approved" ? submission.credential_type : null)
          }
        }
      } catch (error) { console.error(error) }
      finally { setLoading(false) }
    }
    loadProfile()
  }, [isAdmin])

  function toggleInterest(interest: string) {
    setProfile(current => {
      if (current.interests.includes(interest)) return { ...current, interests: current.interests.filter(item => item !== interest) }
      if (current.interests.length >= 10) return current
      return { ...current, interests: [...current.interests, interest] }
    })
  }

  async function saveProfile() {
    setSaving(true); setMessage("")
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: profile.full_name, introduction: isAdmin ? "" : profile.introduction, interests: isAdmin ? [] : profile.interests, is_public: isAdmin ? false : profile.is_public }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to save profile")
      setProfile(current => ({ ...current, full_name: data.profile.full_name ?? current.full_name, introduction: data.profile.introduction ?? current.introduction, interests: data.profile.interests ?? current.interests, is_public: data.profile.is_public ?? current.is_public }))
      setMessage("Profile saved successfully.")
    } catch (error) { setMessage(error instanceof Error ? error.message : "Failed to save profile.") }
    finally { setSaving(false) }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading profile...</p>

  return <div className="space-y-6">
    <div className="space-y-2"><Label htmlFor="full_name">Name</Label><Input id="full_name" value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} placeholder="Your name" maxLength={100} /></div>

    {isAdmin ? <div className="space-y-2"><Label>Role</Label><div className="flex h-10 items-center rounded-md border border-border bg-muted/40 px-3 text-sm font-medium">Admin</div><p className="text-xs text-muted-foreground">Administrator role is assigned by FolioLabs and cannot be edited here.</p></div> : <>
      <div className="rounded-xl border border-border p-4"><p className="text-sm font-medium">Verified role</p>{approvedRole ? <p className="mt-1 text-sm text-primary">{approvedRole} · Verified</p> : <p className="mt-1 text-sm text-muted-foreground">{credentialStatus === "pending" ? "Your submitted role is awaiting admin approval." : credentialStatus === "rejected" ? "Your credential request was not approved. Submit updated proof to verify your role." : "Submit your ID or academic document under Credential verification. Your role appears here after admin approval."}</p>}</div>
      <div className="space-y-2"><Label htmlFor="introduction">Introduction</Label><textarea id="introduction" value={profile.introduction} onChange={e => setProfile({ ...profile, introduction: e.target.value })} placeholder="Tell the community a little about yourself..." maxLength={500} rows={4} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring" /><p className="text-xs text-muted-foreground">{profile.introduction.length}/500</p></div>
      <div className="space-y-3"><div><Label>Interests Area</Label><p className="mt-1 text-xs text-muted-foreground">Select up to 10 areas you're interested in.</p></div><div className="flex flex-wrap gap-2">{INTERESTS.map(interest => { const selected = profile.interests.includes(interest); return <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={`rounded-full border px-3 py-1.5 text-sm transition ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}>{interest}</button> })}</div><p className="text-xs text-muted-foreground">{profile.interests.length}/10 selected</p></div>
      <div className="rounded-xl border border-border p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium">Display profile publicly</p><p className="mt-1 text-xs text-muted-foreground">Allow other FolioLabs users to discover your profile in the Community.</p></div><label className="relative inline-flex cursor-pointer items-center"><input type="checkbox" className="peer sr-only" checked={profile.is_public} onChange={e => setProfile({ ...profile, is_public: e.target.checked })} /><div className="relative h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" /></label></div><div className="mt-3">{profile.is_public ? <p className="text-xs text-primary">✓ Your profile is visible in the Community.</p> : <p className="text-xs text-muted-foreground">Your profile is currently private.</p>}</div></div>
    </>}
    <div className="flex items-center gap-4"><Button onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>{message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}</div>
  </div>
}
