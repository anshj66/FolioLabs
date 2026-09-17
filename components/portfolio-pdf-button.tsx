"use client"

import { useState } from "react"
import {
  Download,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"

export function PortfolioPdfButton() {
  const [loading, setLoading] =
    useState(false)

  async function generatePdf() {
    try {
      setLoading(true)

      const response =
        await fetch(
          "/api/portfolio/generate",
          {
            method: "POST",
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
    <Button
      type="button"
      onClick={generatePdf}
      disabled={loading}
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
  )
}