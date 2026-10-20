import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { isApprovedAcademic } from "@/lib/platform/permissions"

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_FILES = 25
const MAX_TOTAL_BYTES = 1_000_000
const SAFE_FILE_NAME = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Please sign in before compiling a research paper." }, { status: 401 })
  if (isAdminEmail(user.email)) return NextResponse.json({ error: "Administrator accounts do not compile student research papers." }, { status: 403 })
  const { data: profile } = await supabase.from("profiles").select("academic_role,verification_status").eq("id", user.id).maybeSingle()
  if (!isApprovedAcademic(profile)) return NextResponse.json({ error: "Your academic role must be approved before compiling a paper." }, { status: 403 })

  const compilerUrl = process.env.LATEX_COMPILER_URL
  const compilerToken = process.env.LATEX_COMPILER_TOKEN
  if (!compilerUrl || !compilerToken) {
    return NextResponse.json({ error: "The in-platform editor is ready, but PDF compilation has not been configured yet. Set LATEX_COMPILER_URL to the FolioLabs compiler service and redeploy." }, { status: 503 })
  }

  let body: { files?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid compile request." }, { status: 400 }) }
  if (!Array.isArray(body.files) || body.files.length < 1 || body.files.length > MAX_FILES) {
    return NextResponse.json({ error: `Provide between 1 and ${MAX_FILES} project files.` }, { status: 400 })
  }

  let totalBytes = 0
  const files: { name: string; content: string }[] = []
  for (const candidate of body.files) {
    if (!candidate || typeof candidate !== "object") return NextResponse.json({ error: "Invalid project file." }, { status: 400 })
    const file = candidate as { name?: unknown; content?: unknown }
    if (typeof file.name !== "string" || !SAFE_FILE_NAME.test(file.name) || file.name.includes("..")) {
      return NextResponse.json({ error: "File names must be simple names without folders or path traversal." }, { status: 400 })
    }
    if (typeof file.content !== "string") return NextResponse.json({ error: `File ${file.name} has invalid contents.` }, { status: 400 })
    totalBytes += Buffer.byteLength(file.content, "utf8")
    if (totalBytes > MAX_TOTAL_BYTES) return NextResponse.json({ error: "The total source size must be under 1 MB." }, { status: 413 })
    files.push({ name: file.name, content: file.content })
  }
  if (!files.some((file) => file.name === "main.tex")) return NextResponse.json({ error: "Your project needs a main.tex file." }, { status: 400 })
  if (new Set(files.map((file) => file.name)).size !== files.length) return NextResponse.json({ error: "Duplicate file names are not allowed." }, { status: 400 })

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    headers.Authorization = `Bearer ${compilerToken}`
    const upstream = await fetch(compilerUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ files }),
      signal: AbortSignal.timeout(50_000),
      cache: "no-store",
    })
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "")
      let message = detail
      try {
        const parsed = JSON.parse(detail) as { error?: unknown }
        if (typeof parsed.error === "string") message = parsed.error
      } catch { /* keep the plain-text compiler error */ }
      return NextResponse.json({ error: message.slice(0, 4000) || "The LaTeX compiler could not compile this project." }, { status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502 })
    }
    const pdf = await upstream.arrayBuffer()
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=research-paper.pdf",
        "Cache-Control": "no-store",
        "x-compile-log": (upstream.headers.get("x-compile-log") || "Compiled successfully.").slice(0, 1500),
      },
    })
  } catch (error) {
    console.error("ResearchFolio LaTeX compile request failed:", error)
    return NextResponse.json({ error: "Could not reach the FolioLabs LaTeX compiler. Check LATEX_COMPILER_URL and the compiler service status." }, { status: 502 })
  }
}
