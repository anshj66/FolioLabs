"use client"

import { useEffect, useState } from "react"
import {
  Download,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"

type Project = { id: string; title: string; topic?: string | null }
export function PortfolioPdfButton() {
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState("")
  useEffect(() => { fetch("/api/portfolio/projects", { cache: "no-store" }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not load projects"); setProjects(d.projects || []); setSelected((d.projects || []).map((p: Project) => p.id)) }).catch(e => setLoadError(e instanceof Error ? e.message : "Could not load projects")).finally(() => setLoaded(true)) }, [])

  async function generatePdf() {
    try {
      setLoading(true)

      const response =
        await fetch(
          "/api/portfolio/generate",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ project_ids: selected }),
          }
        )

      if (!response.ok) {
        let message =
          "Unable to generate portfolio PDF."

        try {
          const data =
            await response.json()

          if (data?.details) {
            message =
              `${message}\n\n${data.details}`
          }
        } catch {
          // Ignore JSON parsing errors
        }

        throw new Error(message)
      }

      const blob =
        await response.blob()

      const url =
        window.URL.createObjectURL(
          blob
        )

      const link =
        document.createElement("a")

      link.href = url

      link.download =
        "FolioLabs-Portfolio.pdf"

      document.body.appendChild(
        link
      )

      link.click()

      link.remove()

      window.URL.revokeObjectURL(
        url
      )
    } catch (error) {
      console.error(
        "Portfolio download error:",
        error
      )

      alert(
        error instanceof Error
          ? error.message
          : "Unable to generate portfolio PDF."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-3 sm:max-w-sm">
      {loaded && projects.length > 0 && <div className="rounded-xl border border-border p-3"><p className="mb-2 text-sm font-medium">Include projects in this PDF</p><div className="max-h-40 space-y-2 overflow-y-auto">{projects.map(project => <label key={project.id} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={selected.includes(project.id)} onChange={e => setSelected(current => e.target.checked ? [...current, project.id] : current.filter(id => id !== project.id))} className="mt-1"/><span>{project.title}{project.topic ? <span className="block text-xs text-muted-foreground">{project.topic}</span> : null}</span></label>)}</div></div>}
      {loadError && <p className="text-xs text-destructive">{loadError}</p>}
      <Button
      type="button"
      onClick={generatePdf}
      disabled={loading || !loaded || selected.length === 0 && projects.length > 0}
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="size-4" />
          Generate portfolio PDF
        </>
      )}
      </Button>
      {projects.length === 0 && loaded && <p className="text-xs text-muted-foreground">No saved projects yet; the PDF will contain your portfolio identity and verification record.</p>}
    </div>
  )
}