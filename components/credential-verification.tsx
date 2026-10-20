"use client"

import { useEffect, useState, type FormEvent } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const credentialTypes = ["Undergraduate student", "Master's student", "PhD student", "Professor / Faculty"]
const roleValue: Record<string, string> = { "Undergraduate student": "undergraduate", "Master's student": "masters", "PhD student": "phd", "Professor / Faculty": "professor" }
const maxBytes = 10 * 1024 * 1024

export function CredentialVerification() {
  const supabase = createClient()
  const [credentialType, setCredentialType] = useState(credentialTypes[0])
  const [institution, setInstitution] = useState("")
  const [academicYear, setAcademicYear] = useState("1")
  const [document, setDocument] = useState<File | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  async function refresh() {
    const response = await fetch("/api/credentials/submit", { cache: "no-store" })
    const data = await response.json()
    if (response.ok) setStatus(data.submission ?? null)
  }
  useEffect(() => { refresh().catch(() => {}) }, [])

  async function submit(e: FormEvent) {
    e.preventDefault(); setMessage("")
    if (!document) { setMessage("Choose an ID, student card, enrolment letter, or marksheet first."); return }
    if (document.size > maxBytes) { setMessage("File must be 10 MB or smaller."); return }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(document.type)) { setMessage("Upload a PDF, JPG, PNG, or WEBP file."); return }
    setBusy(true)
    let uploadedPath: string | null = null
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error("Please sign in again to submit credentials.")
      const safeName = document.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100)
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await supabase.storage.from("credential-documents").upload(path, document, { contentType: document.type, upsert: false })
      if (uploadError) throw new Error(uploadError.message)
      uploadedPath = path
      const response = await fetch("/api/credentials/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential_type: credentialType, requested_role: roleValue[credentialType], academic_year: credentialType === "Undergraduate student" ? Number(academicYear) : null, institution: institution.trim(), storage_path: path, file_name: safeName, mime_type: document.type }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not submit credentials.")
      setStatus(data.submission); setDocument(null); uploadedPath = null; setMessage("Credentials submitted securely for admin review.")
      const input = window.document.getElementById("credential-file") as HTMLInputElement | null
      if (input) input.value = ""
    } catch (err) {
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage.from("credential-documents").remove([uploadedPath])
        if (cleanupError) console.error("Failed to clean up an unsubmitted credential upload:", cleanupError)
      }
      setMessage(err instanceof Error ? err.message : "Could not submit credentials.")
    }
    finally { setBusy(false) }
  }

  return <div className="space-y-5">
    <div className="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">Upload a student ID, marksheet, enrolment letter, faculty ID, or equivalent document. Documents are uploaded to private storage and accessible only to authorized reviewers while verification is pending. FolioLabs deletes the uploaded document after the final decision; the verification outcome and audit metadata may remain. Accepted formats: PDF, JPG, PNG, WEBP; maximum 10 MB.</div>
    {status && <div className="rounded-xl border border-border p-4"><p className="text-sm font-medium">Latest request: {status.credential_type}</p><p className="mt-1 text-sm text-muted-foreground">Status: <span className="font-medium capitalize text-foreground">{status.status}</span>{status.institution ? ` · ${status.institution}` : ""}</p>{status.admin_note && <p className="mt-2 text-sm">Admin note: {status.admin_note}</p>}</div>}
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="credential-type">What do you want to verify?</Label><select id="credential-type" value={credentialType} onChange={e => setCredentialType(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{credentialTypes.map(x => <option key={x}>{x}</option>)}</select></div>
      {credentialType === "Undergraduate student" && <div className="space-y-2"><Label htmlFor="credential-year">Undergraduate year</Label><select id="credential-year" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{[1,2,3,4,5].map(year => <option key={year} value={year}>Year {year}</option>)}</select></div>}
      <div className="space-y-2"><Label htmlFor="credential-institution">Institution / organization</Label><input id="credential-institution" value={institution} onChange={e => setInstitution(e.target.value)} maxLength={160} placeholder="e.g. BITS Pilani" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /></div>
      <div className="space-y-2"><Label htmlFor="credential-file">Supporting document</Label><input id="credential-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={e => setDocument(e.target.files?.[0] ?? null)} className="block w-full text-sm" /></div>
      <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit for verification"}</Button>
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    </form>
  </div>
}
