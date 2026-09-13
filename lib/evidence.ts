import type { EvidenceEvent } from "@/lib/types"

export function createEvidenceEvent(input: Omit<EvidenceEvent, "id" | "createdAt">): EvidenceEvent {
  return { ...input, id: `evidence-${Date.now()}`, createdAt: new Date().toISOString() }
}

export function evidenceStrength(count: number, verified: number) {
  if (verified >= 8 && count >= 12) return "Strong"
  if (count >= 6) return "Developing"
  return "Building"
}
