export type AcademicRole = "undergraduate" | "masters" | "phd" | "professor"

export type AcademicIdentity = {
  academic_role?: string | null
  academic_year?: number | null
  verification_status?: string | null
}

export function normalizeAcademicRole(value: unknown): AcademicRole | null {
  if (typeof value !== "string") return null
  const role = value.trim().toLowerCase().replace(/[’']/g, "")
  if (["undergraduate", "undergrad", "undergraduate student", "ug"].includes(role)) return "undergraduate"
  if (["masters", "master", "masters student", "master's student", "postgraduate"].includes(role)) return "masters"
  if (["phd", "ph.d.", "phd researcher", "phd student", "doctoral researcher"].includes(role)) return "phd"
  if (["professor", "faculty", "professor / faculty", "academic staff"].includes(role)) return "professor"
  return null
}

export function isApprovedAcademic(identity: AcademicIdentity | null | undefined): boolean {
  return identity?.verification_status === "approved" && normalizeAcademicRole(identity.academic_role) !== null
}

/** Exact directional reviewer hierarchy for community review. */
export function canReviewAuthor(author: AcademicIdentity, reviewer: AcademicIdentity): boolean {
  if (!isApprovedAcademic(author) || !isApprovedAcademic(reviewer)) return false
  const authorRole = normalizeAcademicRole(author.academic_role)
  const reviewerRole = normalizeAcademicRole(reviewer.academic_role)
  if (!authorRole || !reviewerRole) return false
  const year = Number(author.academic_year)
  const reviewerYear = Number(reviewer.academic_year)
  if (authorRole === "undergraduate") {
    if (!Number.isInteger(year) || year < 1 || year > 5) return false
    if (reviewerRole === "professor" || reviewerRole === "phd" || reviewerRole === "masters") return true
    if (reviewerRole !== "undergraduate" || !Number.isInteger(reviewerYear)) return false
    if (year === 1) return [3, 4, 5].includes(reviewerYear)
    if ([2, 3].includes(year)) return [4, 5].includes(reviewerYear)
    return false
  }
  if (authorRole === "masters") return reviewerRole === "phd" || reviewerRole === "professor"
  if (authorRole === "phd") return reviewerRole === "professor"
  return false // professor review requires an explicitly configured specialist/admin pathway
}

export function milestoneForProgress(progress: number): 20 | 40 | 60 | 80 | 100 | null {
  if (!Number.isFinite(progress)) return null
  const valid = [20, 40, 60, 80, 100] as const
  return valid.includes(progress as (typeof valid)[number]) ? (progress as (typeof valid)[number]) : null
}
