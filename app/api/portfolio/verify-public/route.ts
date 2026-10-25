import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { hashVerificationCode, validVerificationCodeShape } from "@/lib/portfolio/verification"

export const runtime = "nodejs"
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const code = typeof body.code === "string" ? body.code.trim() : ""
  const service = createServiceClient()
  // Basic IP-based throttling using recent audit events. No plaintext codes are stored.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const ipHash = hashVerificationCode(forwarded)
  const since = new Date(Date.now() - 10 * 60_000).toISOString()
  const { count } = await service.from("portfolio_verification_events").select("id", { count: "exact", head: true }).eq("code_hash", `ip:${ipHash}`).gte("created_at", since)
  if ((count ?? 0) >= 20) return NextResponse.json({ error: "Too many verification attempts. Please try again later." }, { status: 429 })
  const shaped = validVerificationCodeShape(code)
  const codeHash = shaped ? hashVerificationCode(code) : null
  const { data: record } = codeHash ? await service.from("portfolio_issuances").select("status,display_name,academic_level,project_count,included_projects,disclose_projects,issued_at,version").eq("code_hash", codeHash).maybeSingle() : { data: null }
  const outcome = !record ? "invalid" : record.status === "issued" ? "valid" : "invalid"
  await service.from("portfolio_verification_events").insert([{ code_hash: `ip:${ipHash}`, outcome: (count ?? 0) >= 19 ? "rate_limited" : outcome }, { code_hash: codeHash, outcome }].filter(x => x.code_hash))
  if (!record || record.status !== "issued") return NextResponse.json({ error: "This verification code is invalid or no longer active." }, { status: 404 })
  return NextResponse.json({ status: "valid", message: "Valid FolioLabs-issued portfolio. This verifies the issued record, not independent authorship of every activity.", issued_at: record.issued_at, version: record.version, display_name: record.display_name, academic_level: record.academic_level, project_count: record.project_count, projects: record.disclose_projects ? record.included_projects : [] })
}
