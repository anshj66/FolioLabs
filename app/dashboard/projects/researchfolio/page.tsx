"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, FileText, FlaskConical, GraduationCap, Lightbulb, LoaderCircle, MessageCircle, Plus, Save, Send, Sparkles, X } from "lucide-react"

type Section = { key: string; title: string; description: string; content: string; status?: string }
type ResearchSource = { id: string; title: string; authors: string; year: string; publication: string; doi: string; url: string; apa: string; bibtex: string }
type SectionLog = { notes: string; entries?: { id: string; text: string; createdAt: string }[]; finalizedAt?: string; finalizedContent?: string }
type LatexFile = { name: string; content: string }
type LatexWorkspace = { files: LatexFile[]; activeFile: string }
type ResearchData = { latexWorkspace?: LatexWorkspace; version?: number; researchType?: string; structureMode?: "guided" | "custom"; idea?: string; introduction?: string; hypothesis?: string; courseDescription?: string; researchQuestion?: string; sections?: Section[]; customSectionCounter?: number; sources?: ResearchSource[]; sectionLogs?: Record<string, SectionLog> }
type Project = { id: string; title: string; project_type: "independent" | "course"; topic: string | null; course_title: string | null; current_stage: string; project_data: ResearchData; brief?: string; visibility?: string; community_review_status?: string; updated_at?: string }
type ChatMessage = { role: "user" | "assistant"; content: string }
type Stage = "choose" | "idea" | "structure" | "workspace"

const COURSE_OPTIONS = [
  { id: "research-methods", title: "Research Methods", detail: "Questions, evidence, and experimental design", tag: "Foundations" },
  { id: "mathematics-ai", title: "Mathematics with AI Applications", detail: "Models, simulations, and mathematical discovery", tag: "Mathematics" },
  { id: "computational-physics", title: "Computational Physics", detail: "Build models of physical systems and test them", tag: "Physics" },
  { id: "data-science", title: "Data Science & Society", detail: "Use data to investigate real-world questions", tag: "Interdisciplinary" },
]

const SECTION_PRESETS: Record<string, Section[]> = {
  computational: [
    { key: "introduction", title: "Introduction", description: "Set context, define the problem, and explain why it matters.", content: "" },
    { key: "research_question", title: "Research question & objectives", description: "Define what you want to find out and what success means.", content: "" },
    { key: "literature_review", title: "Literature review", description: "Compare prior work and identify what remains uncertain.", content: "" },
    { key: "hypothesis", title: "Hypothesis / proposition", description: "State a testable expectation or guiding proposition where appropriate.", content: "" },
    { key: "methodology", title: "Methodology & implementation", description: "Explain your model, algorithm, tools, data, and reproducible steps.", content: "" },
    { key: "results", title: "Results & analysis", description: "Record actual outputs, evaluations, charts, and calculations.", content: "" },
    { key: "discussion", title: "Discussion & limitations", description: "Interpret findings, consider alternatives, and acknowledge limits.", content: "" },
    { key: "conclusion", title: "Conclusion & future work", description: "Answer the question based on evidence and describe next steps.", content: "" },
    { key: "references", title: "References", description: "Record sources you actually consulted.", content: "" },
  ],
  experimental: [
    { key: "introduction", title: "Introduction", description: "Set context, define the problem, and explain its importance.", content: "" },
    { key: "research_question", title: "Research question & objectives", description: "Define the research question and measurable objectives.", content: "" },
    { key: "literature_review", title: "Literature review", description: "Compare prior findings and establish the research gap.", content: "" },
    { key: "hypothesis", title: "Hypothesis & variables", description: "State your hypothesis, variables, and expected relationship.", content: "" },
    { key: "methodology", title: "Methodology & experimental setup", description: "Describe equipment, controls, procedures, and safety considerations.", content: "" },
    { key: "results", title: "Results & uncertainty analysis", description: "Record actual observations, tables, measurements, and uncertainty.", content: "" },
    { key: "discussion", title: "Discussion & limitations", description: "Interpret evidence and discuss sources of error or alternative explanations.", content: "" },
    { key: "conclusion", title: "Conclusion & future work", description: "Answer the research question using the collected evidence.", content: "" },
    { key: "references", title: "References", description: "Record sources you actually consulted.", content: "" },
  ],
  theoretical: [
    { key: "introduction", title: "Introduction & motivation", description: "Introduce the problem and motivate the theoretical investigation.", content: "" },
    { key: "research_question", title: "Research question & objectives", description: "State the question, assumptions, and intended contribution.", content: "" },
    { key: "literature_review", title: "Related work", description: "Position your approach against existing theory and results.", content: "" },
    { key: "hypothesis", title: "Conjectures / propositions", description: "State the claims or propositions you intend to investigate.", content: "" },
    { key: "methodology", title: "Definitions & derivations", description: "Document definitions, assumptions, proof strategy, and derivations.", content: "" },
    { key: "results", title: "Results / proofs", description: "Record derived results, proofs, counterexamples, or computational checks.", content: "" },
    { key: "discussion", title: "Discussion & limitations", description: "Explain implications, conditions, and unresolved cases.", content: "" },
    { key: "conclusion", title: "Conclusion & open questions", description: "Summarize what was established and what remains open.", content: "" },
    { key: "references", title: "References", description: "Record sources you actually consulted.", content: "" },
  ],
  review: [
    { key: "introduction", title: "Introduction & scope", description: "Explain the topic, purpose, and boundaries of the review.", content: "" },
    { key: "research_question", title: "Review questions & objectives", description: "Define what the review seeks to synthesize or clarify.", content: "" },
    { key: "methodology", title: "Search strategy & selection criteria", description: "Record databases, search terms, date ranges, and inclusion criteria.", content: "" },
    { key: "literature_review", title: "Literature synthesis", description: "Organize sources by themes, methods, agreements, and contradictions.", content: "" },
    { key: "hypothesis", title: "Emerging propositions", description: "Optional: state themes or propositions emerging from the evidence.", content: "" },
    { key: "results", title: "Evidence map / synthesis", description: "Summarize the included evidence and patterns you observed.", content: "" },
    { key: "discussion", title: "Discussion & limitations", description: "Evaluate the strength and limitations of the available literature.", content: "" },
    { key: "conclusion", title: "Conclusion & future work", description: "Summarize the synthesis and unresolved questions.", content: "" },
    { key: "references", title: "References", description: "Record the sources actually included in your review.", content: "" },
  ],
}

const PROMPTS: Record<string, string[]> = {
  idea: ["Help me narrow my idea", "What makes this researchable?", "Suggest a feasible scope"],
  introduction: ["Help me structure the introduction", "What context am I missing?", "Improve clarity without changing my meaning"],
  research_question: ["Refine my research question", "Suggest measurable objectives", "Check if my scope is feasible"],
  literature_review: ["Find relevant research sources", "Generate search queries", "Help me identify a research gap", "Compare these papers"],
  hypothesis: ["Help me formulate a testable hypothesis", "Explain alternative hypotheses", "Should this project use a hypothesis?"],
  methodology: ["Compare possible research methods", "Review my methodology", "Identify variables and assumptions"],
  results: ["Help me choose evaluation metrics", "Explain this unexpected result", "Help analyze uncertainty"],
  discussion: ["Suggest alternative explanations", "Check my interpretation", "Identify limitations"],
  conclusion: ["Check whether my conclusion follows from evidence", "Suggest future research questions"],
  references: ["Help format my references", "Find claims that need citations", "Check citation consistency"],
}

export default function ResearchFolioPage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>("choose")
  const [project, setProject] = useState<Project | null>(null)
  const [projectType, setProjectType] = useState<"independent" | "course">("independent")
  const [selectedCourse, setSelectedCourse] = useState("")
  const [manualCourse, setManualCourse] = useState("")
  const [courseDescription, setCourseDescription] = useState("")
  const [idea, setIdea] = useState("")
  const [researchType, setResearchType] = useState("computational")
  const [structureMode, setStructureMode] = useState<"guided" | "custom">("guided")
  const [sections, setSections] = useState<Section[]>(SECTION_PRESETS.computational.map((s) => ({ ...s })))
  const [activeSection, setActiveSection] = useState("introduction")
  const [projectTitle, setProjectTitle] = useState("Untitled research project")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [mentorOpen, setMentorOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: "assistant", content: "Welcome to AcademicLab. I can help you sharpen your question, compare methods, or understand a concept. You stay in control of the research." }])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [newSectionTitle, setNewSectionTitle] = useState("")
  const [showAddSection, setShowAddSection] = useState(false)
  const [paperPanel, setPaperPanel] = useState<"preview" | "references" | "evidence" | null>(null)
  const [latexOpen, setLatexOpen] = useState(false)
  const [communityOpen, setCommunityOpen] = useState(false)
  const [communityBrief, setCommunityBrief] = useState("")
  const [communityBusy, setCommunityBusy] = useState(false)
  const [finalizingSection, setFinalizingSection] = useState("")
  const [communityMessage, setCommunityMessage] = useState("")
  const [latexFiles, setLatexFiles] = useState<LatexFile[]>([])
  const [latexActiveFile, setLatexActiveFile] = useState("main.tex")
  const [compileLoading, setCompileLoading] = useState(false)
  const [compileLog, setCompileLog] = useState("")
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [sources, setSources] = useState<ResearchSource[]>([])
  const [sectionLogs, setSectionLogs] = useState<Record<string, SectionLog>>({})
  const [feedbackUnlocks, setFeedbackUnlocks] = useState<string[]>([])
  const [sourceTitle, setSourceTitle] = useState("")
  const [sourceAuthors, setSourceAuthors] = useState("")
  const [sourceYear, setSourceYear] = useState(String(new Date().getFullYear()))
  const [sourcePublication, setSourcePublication] = useState("")
  const [sourceDoi, setSourceDoi] = useState("")
  const [sourceUrl, setSourceUrl] = useState("")
  const [citationStyle, setCitationStyle] = useState<"APA 7" | "BibTeX">("APA 7")
  const [error, setError] = useState("")
  const [dirty, setDirty] = useState(false)
  const loadedRef = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ideaRef = useRef<HTMLTextAreaElement>(null)
  const sectionRef = useRef<HTMLTextAreaElement>(null)

  const active = sections.find((section) => section.key === activeSection) ?? sections[0]
  const filledCount = sections.filter((section) => section.content.trim()).length
  const progress = sections.length ? Math.round((filledCount / sections.length) * 100) : 0
  const contextLabel = projectType === "course" ? (selectedCourse || manualCourse || project?.course_title || "University course") : "Independent research"

  const applyProject = useCallback((loaded: Project) => {
    setProject(loaded)
    setProjectType(loaded.project_type)
    setProjectTitle(loaded.title || "Untitled research project")
    setCommunityBrief(loaded.brief || "")
    setSelectedCourse(loaded.course_title || "")
    const data = loaded.project_data ?? {}
    setIdea(data.idea || loaded.topic || "")
    setCourseDescription(data.courseDescription || "")
    setSources(Array.isArray(data.sources) ? data.sources : [])
    setSectionLogs(data.sectionLogs && typeof data.sectionLogs === "object" ? data.sectionLogs : {})
    const savedLatex = data.latexWorkspace
    if (savedLatex && Array.isArray(savedLatex.files) && savedLatex.files.some((file: LatexFile) => file.name === "main.tex")) {
      setLatexFiles(savedLatex.files.filter((file: LatexFile) => typeof file.name === "string" && typeof file.content === "string"))
      setLatexActiveFile(typeof savedLatex.activeFile === "string" ? savedLatex.activeFile : "main.tex")
    } else {
      const escapeTex = (value: string) => value.replace(/[\\{}%$&#_~^]/g, (character) => ({ "\\": "\\textbackslash{}", "{": "\\{", "}": "\\}", "%": "\\%", "$": "\\$", "&": "\\&", "#": "\\#", "_": "\\_", "~": "\\textasciitilde{}", "^": "\\textasciicircum{}" }[character] || character))
      const manuscript = `\\documentclass[12pt]{article}\n\\usepackage[margin=1in]{geometry}\n\\usepackage[T1]{fontenc}\n\\usepackage{amsmath,amssymb}\n\\usepackage{graphicx}\n\\usepackage{hyperref}\n\\title{${escapeTex(loaded.title || "Research paper")}}\n\\author{}\n\\date{\\today}\n\n\\begin{document}\n\\maketitle\n\n${(Array.isArray(data.sections) ? data.sections : []).map((section: Section) => `\\section{${escapeTex(section.title)}}\n\n${escapeTex(section.content || "% Start writing this section here.").replace(/\n/g, "\n\n")}`).join("\n\n")}\n\n\\end{document}\n`
      setLatexFiles([{ name: "main.tex", content: manuscript }, { name: "references.bib", content: "% Add BibTeX entries here.\n" }])
      setLatexActiveFile("main.tex")
    }
    const kind = data.researchType || "computational"
    setResearchType(SECTION_PRESETS[kind] ? kind : "computational")
    setStructureMode(data.structureMode || "guided")
    setSections(Array.isArray(data.sections) && data.sections.length ? data.sections : SECTION_PRESETS[kind] || SECTION_PRESETS.computational)
    setActiveSection((Array.isArray(data.sections) && data.sections[0]?.key) || "introduction")
    loadedRef.current = true
    setDirty(false)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get("projectId") || params.get("id")
    if (!id) { loadedRef.current = true; return }
    let cancelled = false
    setLoading(true)
    fetch(`/api/researchfolio/projects?id=${encodeURIComponent(id)}`, { cache: "no-store" }).then(async (response) => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load this research project.")
      if (!cancelled) {
        applyProject(data.project); setStage("workspace")
        fetch("/api/researchfolio/feedback", { cache: "no-store" }).then(r => r.json()).then(feedback => {
          if (cancelled) return
          setFeedbackUnlocks((feedback.received ?? []).filter((item: any) => { const finalizedAt = data.project.project_data?.sectionLogs?.[item.section_key]?.finalizedAt; return item.project_id === data.project.id && item.section_key !== "__project__" && finalizedAt && new Date(item.created_at).getTime() > new Date(finalizedAt).getTime() }).map((item: any) => item.section_key))
        }).catch(() => { if (!cancelled) setFeedbackUnlocks([]) })
      }
    }).catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Could not load project.") }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [applyProject])

  useEffect(() => {
    if (stage === "idea") window.setTimeout(() => ideaRef.current?.focus(), 350)
    if (stage === "workspace") window.setTimeout(() => sectionRef.current?.focus({ preventScroll: true }), 250)
  }, [stage, activeSection])

  const persist = useCallback(async (overrides?: Partial<Project>) => {
    if (!project?.id) return
    setSaving(true); setSaveError("")
    const nextData: ResearchData = { ...(project.project_data || {}), version: 3, latexWorkspace: { files: latexFiles, activeFile: latexActiveFile }, idea, introduction: sections.find((s) => s.key === "introduction")?.content || "", hypothesis: sections.find((s) => s.key === "hypothesis")?.content || "", courseDescription, researchType, structureMode, sections, sources, sectionLogs }
    const body = { id: project.id, title: projectTitle, project_type: projectType, topic: idea, course_title: projectType === "course" ? (selectedCourse || manualCourse) : null, current_stage: active?.title || "Project setup", project_data: nextData, ...overrides }
    try {
      const response = await fetch("/api/researchfolio/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not save changes.")
      setProject(data.project); setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })); setDirty(false); return true
    } catch (e) { setSaveError(e instanceof Error ? e.message : "Save failed."); return false } finally { setSaving(false) }
  }, [project, idea, sections, courseDescription, researchType, structureMode, projectTitle, projectType, selectedCourse, manualCourse, active?.title, sources, sectionLogs, latexFiles, latexActiveFile])

  useEffect(() => {
    if (!loadedRef.current || !project?.id || !dirty) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { void persist() }, 850)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [dirty, project?.id, persist])

  async function beginProject() {
    if (projectType === "course" && !selectedCourse && !manualCourse.trim()) { setError("Choose a course or enter its name to continue."); return }
    setLoading(true); setError("")
    try {
      const courseTitle = projectType === "course" ? (selectedCourse || manualCourse.trim()) : null
      const response = await fetch("/api/researchfolio/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", project_type: projectType, title: idea.trim().slice(0, 70) || (courseTitle ? `${courseTitle} research` : "Untitled research project") }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not create project.")
      const created: Project = { ...data.project, course_title: courseTitle, project_data: { ...(data.project.project_data || {}), researchType, structureMode, idea: "", courseDescription, sections: SECTION_PRESETS[researchType].map((s) => ({ ...s })), sources: [], sectionLogs: {} } }
      const saveResponse = await fetch("/api/researchfolio/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: created.id, title: created.title, project_type: projectType, course_title: courseTitle, current_stage: "Research idea", project_data: created.project_data }) })
      if (!saveResponse.ok) throw new Error("Project was created, but its setup could not be saved. Reopen it from My Projects.")
      const saved = await saveResponse.json()
      applyProject(saved.project)
      setStage("idea")
      router.replace(`/dashboard/projects/researchfolio?projectId=${saved.project.id}`)
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create your project.") } finally { setLoading(false) }
  }

  function changeSectionContent(value: string) {
    const log = sectionLogs[activeSection]
    if (log?.finalizedAt && !feedbackUnlocks.includes(activeSection)) {
      setError("This section is finalized and locked. It can be edited only after feedback arrives for this section.")
      return
    }
    if (log?.finalizedAt && feedbackUnlocks.includes(activeSection)) {
      setSectionLogs(current => ({ ...current, [activeSection]: { ...(current[activeSection] || { notes: "" }), finalizedAt: undefined, finalizedContent: undefined, unlockedByFeedbackAt: new Date().toISOString() } as SectionLog }))
    }
    setSections((current) => current.map((section) => section.key === activeSection ? { ...section, content: value } : section))
    setDirty(true); setError("")
  }

  function submitIdea() {
    if (idea.trim().length < 8) { setError("Add a little more detail so we have something meaningful to investigate."); return }
    setError(""); setProjectTitle((current) => current === "Untitled research project" ? idea.trim().slice(0, 70) : current)
    setSections((current) => current.map((section) => section.key === "introduction" ? { ...section, content: section.content || `This project investigates ${idea.trim()}.\n\nContext and motivation:\n\nProblem being addressed:\n\nWhy this matters:` } : section))
    setDirty(true); setStage("structure")
  }

  function setStructure(nextMode: "guided" | "custom") {
    setStructureMode(nextMode)
    if (nextMode === "guided") setSections(SECTION_PRESETS[researchType].map((suggested) => {
      const previous = sections.find((section) => section.key === suggested.key)
      return previous ? { ...suggested, content: previous.content } : { ...suggested }
    }))
    setDirty(true)
  }

  function changeResearchType(kind: string) {
    if (!SECTION_PRESETS[kind]) return
    const next = SECTION_PRESETS[kind].map((suggested) => {
      const previous = sections.find((section) => section.key === suggested.key)
      return previous ? { ...suggested, content: previous.content } : { ...suggested }
    })
    setResearchType(kind); setSections(next); setActiveSection("introduction"); setDirty(true)
  }

  function addCustomSection() {
    const title = newSectionTitle.trim()
    if (!title) return
    const key = `custom_${Date.now()}`
    setSections((current) => [...current, { key, title, description: "A custom section for your research.", content: "" }])
    setActiveSection(key); setNewSectionTitle(""); setShowAddSection(false); setDirty(true)
  }

  function removeSection(key: string) {
    if (sections.length < 2) return
    const next = sections.filter((section) => section.key !== key)
    setSections(next); if (activeSection === key) setActiveSection(next[0]?.key || "introduction"); setDirty(true)
  }

  function moveSection(key: string, direction: -1 | 1) {
    const index = sections.findIndex((section) => section.key === key)
    const target = index + direction
    if (index < 0 || target < 0 || target >= sections.length) return
    const next = [...sections]; [next[index], next[target]] = [next[target], next[index]]; setSections(next); setDirty(true)
  }

  function makeCitation() {
    const title = sourceTitle.trim()
    if (!title) { setError("Enter a source title to generate a citation."); return }
    const authors = sourceAuthors.trim() || "Unknown author"
    const year = sourceYear.trim() || "n.d."
    const authorParts = authors.split(/,| and | & /i).map((x) => x.trim()).filter(Boolean)
    const apaAuthors = authorParts.length > 1 ? `${authorParts.slice(0, -1).join(", ")}, & ${authorParts[authorParts.length - 1]}` : authors
    const apa = `${apaAuthors} (${year}). ${title}.${sourcePublication.trim() ? ` ${sourcePublication.trim()}.` : ""}${sourceDoi.trim() ? ` https://doi.org/${sourceDoi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}` : sourceUrl.trim() ? ` ${sourceUrl.trim()}` : ""}`
    const citeKey = `${(authorParts[0] || "source").toLowerCase().replace(/[^a-z0-9]/g, "")}${year.replace(/[^0-9]/g, "") || "nd"}`
    const bibtex = `@article{${citeKey},
  title = {${title.replace(/[{}]/g, "")}},
  author = {${authors.replace(/[{}]/g, "")}},
  year = {${year.replace(/[{}]/g, "")}}${sourcePublication.trim() ? `,
  journal = {${sourcePublication.trim().replace(/[{}]/g, "")}}` : ""}${sourceDoi.trim() ? `,
  doi = {${sourceDoi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}}` : ""}${sourceUrl.trim() ? `,
  url = {${sourceUrl.trim()}}` : ""}
}`
    const source: ResearchSource = { id: `source_${Date.now()}`, title, authors, year, publication: sourcePublication.trim(), doi: sourceDoi.trim(), url: sourceUrl.trim(), apa, bibtex }
    setSources((current) => [...current, source])
    setSections((current) => current.map((section) => section.key === "references" ? { ...section, content: [...current.filter((s) => s.key === "references").map((s) => s.content.trim()).filter(Boolean), apa].join("\n\n") } : section))
    setSourceTitle(""); setSourceAuthors(""); setSourcePublication(""); setSourceDoi(""); setSourceUrl(""); setDirty(true); setError("")
  }

  function updateSectionLog(key: string, notes: string) {
    setSectionLogs((current) => ({ ...current, [key]: { ...(current[key] || { notes: "" }), notes } }))
    setDirty(true)
  }

  function addSectionLogEntry(key: string) {
    const currentLog = sectionLogs[key] || { notes: "", entries: [] }
    const text = currentLog.notes.trim()
    if (!text) { setError("Write a short research log entry first."); return }
    setSectionLogs((current) => ({ ...current, [key]: { ...(current[key] || { notes: "", entries: [] }), notes: "", entries: [...(current[key]?.entries || []), { id: `log_${Date.now()}`, text, createdAt: new Date().toISOString() }] } }))
    setDirty(true); setError("")
  }

  async function finalizeSection(section: Section) {
    if (!project?.id) { setError("Save the project before finalizing a section."); return }
    if (!section.content.trim()) { setError("Add some content to this section before finalizing it."); return }
    const previous = sectionLogs[section.key]?.finalizedAt ? "This will update the existing finalized snapshot." : "This will create a finalized snapshot of the current section content."
    if (!window.confirm(`${previous} The saved content and timestamp will be recorded in your project evidence. Project progress rewards are only awarded once per milestone. Continue?`)) return
    setFinalizingSection(section.key); setError("")
    try {
      const saved = await persist()
      if (saved === false) throw new Error("Your draft could not be saved. Fix the save issue before finalizing.")
      const response = await fetch("/api/researchfolio/finalize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_id: project.id, section_key: section.key }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Could not finalize this section.")
      applyProject(result.project)
      setFeedbackUnlocks(current => current.filter(key => key !== section.key))
      setError(result.earned_milestones?.length ? `Section finalized. Earned ${result.earned_milestones.join("%, ")}% milestone credit reward${result.earned_milestones.length > 1 ? "s" : ""}.` : "Section finalized and saved to your evidence log.")
    } catch (e) { setError(e instanceof Error ? e.message : "Could not finalize this section.") }
    finally { setFinalizingSection("") }
  }

  function paperText() {
    return `${projectTitle}\n\n${idea ? `Research idea: ${idea}\n\n` : ""}${sections.map((section) => `${section.title}\n\n${section.content.trim() || "[This section has not been drafted yet.]"}`).join("\n\n\n")}`
  }

  function createZip(files: { name: string; content: string }[]) {
    const encoder = new TextEncoder()
    const crc32 = (bytes: Uint8Array) => {
      let crc = 0xffffffff
      for (const byte of bytes) {
        crc ^= byte
        for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
      }
      return (crc ^ 0xffffffff) >>> 0
    }
    const u16 = (value: number) => new Uint8Array([value & 255, (value >>> 8) & 255])
    const u32 = (value: number) => new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255])
    const join = (parts: Uint8Array[]) => {
      const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
      let offset = 0
      for (const part of parts) { out.set(part, offset); offset += part.length }
      return out
    }
    const localParts: Uint8Array[] = []
    const centralParts: Uint8Array[] = []
    let offset = 0
    for (const file of files) {
      const name = encoder.encode(file.name)
      const data = encoder.encode(file.content)
      const crc = crc32(data)
      const local = join([u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data])
      localParts.push(local)
      const central = join([u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name])
      centralParts.push(central)
      offset += local.length
    }
    const centralDirectory = join(centralParts)
    const end = join([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(centralDirectory.length), u32(offset), u16(0)])
    return new Blob([...localParts, centralDirectory, end], { type: "application/zip" })
  }

  const activeLatexFile = latexFiles.find((file) => file.name === latexActiveFile) ?? latexFiles[0]

  function updateLatexFile(content: string) {
    if (!activeLatexFile) return
    setLatexFiles((files) => files.map((file) => file.name === activeLatexFile.name ? { ...file, content } : file))
    setDirty(true)
    setCompileLog("")
  }

  function addLatexFile() {
    const raw = window.prompt("New file name (for example, methods.tex or figure-description.txt):", "methods.tex")
    if (!raw) return
    const name = raw.trim()
    if (!/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(name) || name.includes("..")) { setCompileLog("Use a simple file name such as methods.tex. Folder paths are not supported in this editor yet."); return }
    if (latexFiles.some((file) => file.name === name)) { setCompileLog("A file with that name already exists."); return }
    setLatexFiles((files) => [...files, { name, content: name.endsWith(".tex") ? "% New LaTeX file\n" : "% New project file\n" }])
    setLatexActiveFile(name)
    setDirty(true)
  }

  async function compileLatex() {
    setCompileLoading(true); setCompileLog("Compiling project…")
    try {
      const response = await fetch("/api/researchfolio/compile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files: latexFiles }) })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Compilation failed.")
      }
      const blob = await response.blob()
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
      const nextUrl = URL.createObjectURL(blob)
      setPdfUrl(nextUrl)
      setCompileLog(response.headers.get("x-compile-log") || "Compiled successfully.")
      await persist()
    } catch (error) {
      setCompileLog(error instanceof Error ? error.message : "Could not compile this LaTeX project.")
    } finally { setCompileLoading(false) }
  }

  function downloadLatexProject() {
    const blob = createZip(latexFiles.map((file) => ({ name: file.name, content: file.content })))
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "research-paper"}-latex-source.zip`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function openWorkspace() { setStage("workspace"); setDirty(true); void persist({ current_stage: "Research workspace" }) }

  async function submitCommunityReview() {
    if (!project?.id) { setCommunityMessage("Save the project first, then submit it for review."); return }
    if (communityBrief.trim().length < 20) { setCommunityMessage("Write a public-facing brief of at least 20 characters."); return }
    setCommunityBusy(true); setCommunityMessage("")
    try {
      const saved = await persist()
      if (saved === false) throw new Error("Your project could not be saved. Fix the save issue before publishing.")
      const response = await fetch("/api/researchfolio/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "publish", project_id: project.id, brief: communityBrief }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not submit for community review.")
      setProject((current) => current ? { ...current, brief: data.project.brief, visibility: "community", community_review_status: "published" } : current)
      setCommunityMessage("Your project is now published for eligible community review.")
      setCommunityOpen(false)
    } catch (e) { setCommunityMessage(e instanceof Error ? e.message : "Could not submit for community review.") }
    finally { setCommunityBusy(false) }
  }

  async function sendMentorMessage(messageOverride?: string) {
    const message = (messageOverride ?? chatInput).trim()
    if (!message || chatLoading) return
    setChatInput("")
    setChatMessages((current) => [...current, { role: "user", content: message }])
    setChatLoading(true)
    const context = `You are AcademicLab, the research mentor inside FolioLabs ResearchFolio. Guide, do not fabricate. Never invent sources, DOIs, experiments, or results. Label suggestions as suggestions and distinguish real evidence from assumptions. Ask clarifying questions if necessary. Encourage the student to approve changes themselves.\nPROJECT CONTEXT:\nProject title: ${projectTitle}\nProject type: ${projectType}\nCourse/topic context: ${contextLabel}\nCourse description: ${courseDescription || "not supplied"}\nResearch idea: ${idea || "not established"}\nResearch type: ${researchType}\nCurrent section: ${active?.title || "Research framing"}\nCurrent section draft: ${active?.content || "empty"}\nOther section summaries: ${sections.filter((s) => s.key !== activeSection && s.content.trim()).map((s) => `${s.title}: ${s.content.slice(0, 500)}`).join("\n") || "No other section drafts yet"}\n\nStudent request: ${message}\n\nRespond with practical, topic-specific guidance. If you suggest text, make it clear that it is a draft for the student to review. Do not claim to have searched the web or verified a source unless a retrieval tool was actually used.`
    try {
      const response = await fetch("/api/ai/mentor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, sessionId, researchMode: "researchfolio", researchContext: context }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "AcademicLab could not respond.")
      if (data.sessionId) setSessionId(data.sessionId)
      setChatMessages((current) => [...current, { role: "assistant", content: data.response || "I couldn't generate a response just now. Please try again." }])
    } catch (e) { setChatMessages((current) => [...current, { role: "assistant", content: e instanceof Error ? e.message : "AcademicLab is unavailable right now." }]) } finally { setChatLoading(false) }
  }

  const promptSuggestions = useMemo(() => PROMPTS[activeSection] || PROMPTS[stage === "idea" ? "idea" : "introduction"], [activeSection, stage])

  if (loading && !project && new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").has("projectId")) return <div className="flex min-h-[70vh] items-center justify-center gap-3 text-sm text-muted-foreground"><LoaderCircle className="size-5 animate-spin"/>Opening your Research Lab…</div>

  return <div className="rf-lab relative -m-4 min-h-[calc(100svh-64px)] overflow-hidden bg-[#071310] text-slate-100 sm:-m-6 lg:-m-8">
    <style jsx global>{`
      @keyframes rf-enter{from{opacity:0;transform:translateY(24px) scale(.99)}to{opacity:1;transform:translateY(0) scale(1)}}
      @keyframes rf-rise{0%{opacity:0;transform:translateY(35px)}100%{opacity:1;transform:translateY(0)}}
      @keyframes rf-breathe{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:.85;transform:scale(1.08)}}
      @keyframes rf-orbit{to{transform:rotate(360deg)}}
      .rf-enter{animation:rf-enter .6s cubic-bezier(.2,.75,.25,1) both}.rf-rise{animation:rf-rise .55s cubic-bezier(.2,.75,.25,1) both}.rf-breathe{animation:rf-breathe 8s ease-in-out infinite}.rf-orbit{animation:rf-orbit 42s linear infinite}
      .rf-panel{border:1px solid rgba(167,243,208,.13);background:rgba(255,255,255,.035);backdrop-filter:blur(18px)}
      .rf-field{width:100%;resize:vertical;color:#ecfdf5;background:rgba(255,255,255,.04);border:1px solid rgba(167,243,208,.18);border-radius:14px;padding:14px 16px;outline:none;line-height:1.75;transition:border-color .2s,background .2s,box-shadow .2s}
      .rf-field:focus{border-color:rgba(110,231,183,.75);background:rgba(255,255,255,.06);box-shadow:0 0 0 4px rgba(52,211,153,.08)}.rf-field::placeholder{color:rgba(226,232,240,.35)}
      .rf-choice{border:1px solid rgba(167,243,208,.14);background:rgba(255,255,255,.035);transition:all .22s ease}.rf-choice:hover{border-color:rgba(110,231,183,.45);transform:translateY(-2px);background:rgba(110,231,183,.06)}.rf-choice.selected{border-color:#6ee7b7;background:rgba(52,211,153,.1);box-shadow:0 0 0 1px rgba(110,231,183,.15) inset}
      .rf-scroll::-webkit-scrollbar{width:5px}.rf-scroll::-webkit-scrollbar-thumb{background:#ffffff24;border-radius:99px}
      @media(prefers-reduced-motion:reduce){.rf-enter,.rf-rise,.rf-breathe,.rf-orbit{animation:none!important}.rf-choice{transition:none!important}}
    `}</style>
    <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="rf-breathe absolute -left-36 -top-36 size-[34rem] rounded-full bg-emerald-500/10 blur-[110px]"/><div className="absolute -right-40 top-1/3 size-[38rem] rounded-full bg-teal-400/[.07] blur-[120px]"/><div className="rf-orbit absolute left-1/2 top-[40%] size-[min(88vw,850px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-100/[.045]"/><div className="absolute inset-0 opacity-[.1]" style={{ backgroundImage: "radial-gradient(rgba(167,243,208,.5) .7px, transparent .7px)", backgroundSize: "28px 28px" }}/></div>

    <header className="relative z-10 flex min-h-[72px] items-center justify-between gap-4 border-b border-white/10 px-4 sm:px-8"><button onClick={() => stage === "workspace" ? setStage("structure") : stage === "structure" ? setStage("idea") : stage === "idea" ? setStage("choose") : router.push("/dashboard/projects")} className="inline-flex min-w-0 items-center gap-3 text-left" aria-label="Go back"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/20 bg-emerald-300/10 text-emerald-200"><FlaskConical className="size-5"/></span><span className="min-w-0"><span className="block text-sm font-semibold tracking-wide">ResearchFolio</span><span className="block truncate text-[11px] text-emerald-100/50">{project ? projectTitle : "FolioLabs Research Lab"}</span></span></button><div className="flex items-center gap-2">{project && <span className="hidden items-center gap-1.5 text-[11px] text-emerald-100/55 sm:inline-flex">{saving ? <><LoaderCircle className="size-3 animate-spin"/> Saving</> : saveError ? <><X className="size-3 text-rose-300"/> Save issue</> : <><CheckCircle2 className="size-3"/> {lastSaved ? `Saved ${lastSaved}` : "Autosave on"}</>}</span>}<button onClick={() => router.push("/dashboard/projects")} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.04] px-3 py-2.5 text-xs font-semibold text-white/75 transition hover:border-emerald-200/40 hover:bg-emerald-200/10 hover:text-white sm:px-4"><ArrowLeft className="size-3.5"/> Exit Research Lab</button></div></header>

    <main className={`relative z-10 mx-auto flex w-full flex-col px-4 pb-28 pt-8 sm:px-7 sm:pt-10 ${stage === "workspace" ? "max-w-[1400px]" : "min-h-[calc(100svh-72px)] max-w-5xl"}`}>
      {error && <div role="alert" className="rf-enter mb-5 flex items-start justify-between gap-3 rounded-xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X className="size-4"/></button></div>}
      {saveError && <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200/20 bg-amber-200/[.06] px-4 py-2.5 text-xs text-amber-100"><span>{saveError}</span><button onClick={() => void persist()} className="font-semibold underline">Retry save</button></div>}

      {stage === "choose" && <section className="rf-enter my-auto py-8"><div className="mx-auto max-w-3xl text-center"><div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-300/10 text-emerald-200 shadow-[0_0_65px_rgba(16,185,129,.13)]"><Sparkles className="size-7"/></div><p className="text-xs font-semibold uppercase tracking-[.28em] text-emerald-200/70">A space for questions that matter</p><h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">Every discovery begins<br className="hidden sm:block"/> with a <span className="text-emerald-200">why.</span></h1><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-300/70 sm:text-base">Choose your starting point. ResearchFolio will keep the topic or course in context as you plan, investigate, and write.</p></div>
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2"><button onClick={() => { setProjectType("independent"); setSelectedCourse(""); setError("") }} className={`rf-choice rounded-2xl p-5 text-left ${projectType === "independent" ? "selected" : ""}`}><span className="flex size-11 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200"><Lightbulb className="size-5"/></span><span className="mt-4 block text-lg font-semibold">Independent project</span><span className="mt-2 block text-sm leading-6 text-slate-300/65">Start with your own curiosity, idea, or real-world problem.</span><span className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-200">Start from scratch <ChevronRight className="size-4"/></span></button><button onClick={() => { setProjectType("course"); setError("") }} className={`rf-choice rounded-2xl p-5 text-left ${projectType === "course" ? "selected" : ""}`}><span className="flex size-11 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><GraduationCap className="size-5"/></span><span className="mt-4 block text-lg font-semibold">Research through a course</span><span className="mt-2 block text-sm leading-6 text-slate-300/65">Use a college course, syllabus, or assignment brief as your research context.</span><span className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-200">Choose a course <ChevronRight className="size-4"/></span></button></div>
        {projectType === "course" && <div className="rf-enter mx-auto mt-4 max-w-3xl rounded-2xl border border-white/10 bg-white/[.025] p-5"><label className="text-sm font-medium">Choose a sample course <span className="font-normal text-slate-400">(examples, not verified university listings)</span></label><div className="mt-3 grid gap-2 sm:grid-cols-2">{COURSE_OPTIONS.map((course) => <button key={course.id} onClick={() => { setSelectedCourse(course.title); setManualCourse("") }} className={`rf-choice rounded-xl p-3 text-left ${selectedCourse === course.title ? "selected" : ""}`}><span className="text-[10px] uppercase tracking-wider text-emerald-200/70">{course.tag}</span><span className="mt-1 block text-sm font-semibold">{course.title}</span><span className="mt-1 block text-xs leading-5 text-slate-300/55">{course.detail}</span></button>)}</div><div className="mt-4"><label className="text-xs text-slate-300/70">Or enter your own course</label><input value={manualCourse} onChange={(e) => { setManualCourse(e.target.value); if (e.target.value) setSelectedCourse("") }} placeholder="e.g. Quantum Mechanics II" className="rf-field mt-2"/></div><div className="mt-3"><label className="text-xs text-slate-300/70">Course description / assignment brief (optional)</label><textarea value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)} placeholder="Paste learning objectives, syllabus topics, or assignment requirements…" rows={3} className="rf-field mt-2"/></div></div>}
        <div className="mt-7 flex justify-center"><button disabled={loading || (projectType === "course" && !selectedCourse && !manualCourse.trim())} onClick={beginProject} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-6 text-sm font-semibold text-emerald-950 shadow-[0_8px_35px_rgba(16,185,129,.15)] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40">{loading ? <LoaderCircle className="size-4 animate-spin"/> : null} Begin research <ArrowRight className="size-4"/></button></div>
      </section>}

      {stage === "idea" && <section className="rf-enter my-auto mx-auto w-full max-w-3xl py-8"><div className="text-center"><p className="text-xs font-semibold uppercase tracking-[.24em] text-emerald-200/70">Step 01 · Your starting point</p><h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-5xl">What are you curious<br className="hidden sm:block"/> enough to investigate?</h1><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-300/65">Don't worry about making it perfect. Start with a question, a contradiction, a problem, or something you wish you understood better.</p></div><div className="rf-panel rf-rise mt-9 rounded-3xl p-5 sm:p-7"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200"><Lightbulb className="size-5"/></div><div><p className="text-sm font-semibold">Your research seed</p><p className="text-xs text-slate-300/55">{contextLabel}</p></div></div><label htmlFor="research-idea" className="mt-5 block text-sm font-medium">Describe the idea in your own words</label><textarea ref={ideaRef} id="research-idea" value={idea} onChange={(e) => { setIdea(e.target.value); setDirty(true) }} rows={5} placeholder="I've been wondering whether… / I noticed that… / I want to investigate how…" className="rf-field mt-3"/><div className="mt-4 flex flex-wrap gap-2">{PROMPTS.idea.map((prompt) => <button key={prompt} onClick={() => { setMentorOpen(true); void sendMentorMessage(prompt) }} className="rounded-full border border-emerald-200/15 px-3 py-2 text-xs text-emerald-100/75 transition hover:border-emerald-200/40 hover:bg-emerald-200/[.06]">{prompt}</button>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div><label className="text-xs text-slate-300/65">Research approach (you can change this later)</label><select value={researchType} onChange={(e) => changeResearchType(e.target.value)} className="rf-field mt-2"><option value="computational">Computational / simulation</option><option value="experimental">Experimental / empirical</option><option value="theoretical">Theoretical / mathematical</option><option value="review">Literature review</option></select></div><div><label className="text-xs text-slate-300/65">Working title</label><input value={projectTitle} onChange={(e) => { setProjectTitle(e.target.value); setDirty(true) }} className="rf-field mt-2" placeholder="A working title for your project"/></div></div>{projectType === "course" && <div className="mt-4"><label className="text-xs text-slate-300/65">Course context / requirements</label><textarea value={courseDescription} onChange={(e) => { setCourseDescription(e.target.value); setDirty(true) }} rows={3} className="rf-field mt-2" placeholder="Course learning goals, assignment prompt, or constraints…"/></div>}<div className="mt-5 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-300/45">Your idea is saved as you work.</span><button onClick={submitIdea} className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-300 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200">Shape my research <ArrowRight className="size-4"/></button></div></div></section>}

      {stage === "structure" && <section className="rf-enter mx-auto w-full max-w-5xl py-4"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.24em] text-emerald-200/70">Step 02 · Design your paper</p><h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Choose a structure that fits your question.</h1><p className="mt-3 text-sm leading-7 text-slate-300/65">Your project type is <span className="font-medium text-emerald-100">{researchType.replace("computational", "computational / simulation").replace("experimental", "experimental / empirical").replace("theoretical", "theoretical / mathematical").replace("review", "literature review")}</span>. Suggested sections are a starting point, not a rigid template.</p></div><div className="mt-6 grid gap-4 md:grid-cols-2"><button onClick={() => setStructure("guided")} className={`rf-choice rounded-2xl p-5 text-left ${structureMode === "guided" ? "selected" : ""}`}><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200"><Sparkles className="size-5"/></span><h2 className="mt-4 font-semibold">Suggest a structure for me</h2><p className="mt-2 text-sm leading-6 text-slate-300/60">Start with a discipline-aware outline, then add, rename, remove, or reorder sections.</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-200">{structureMode === "guided" ? <Check className="size-4"/> : null} Use guided suggestions</span></button><button onClick={() => setStructure("custom")} className={`rf-choice rounded-2xl p-5 text-left ${structureMode === "custom" ? "selected" : ""}`}><span className="flex size-10 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><FileText className="size-5"/></span><h2 className="mt-4 font-semibold">I'll build my own structure</h2><p className="mt-2 text-sm leading-6 text-slate-300/60">Start with an editable outline. Keep only the sections that fit your research and add your own.</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-200">{structureMode === "custom" ? <Check className="size-4"/> : null} Customize my outline</span></button></div><div className="rf-panel mt-5 rounded-2xl p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Your paper outline</h2><p className="mt-1 text-xs text-slate-300/55">{sections.length} sections · {sections.filter((s) => ["introduction", "methodology", "results", "conclusion"].includes(s.key)).length} core sections currently included</p></div><div className="flex gap-2"><button onClick={() => setShowAddSection(!showAddSection)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/[.06]"><Plus className="size-3.5"/> Add section</button><button onClick={() => void sendMentorMessage("Review this proposed research structure for my topic. Explain which sections are essential, optional, or not applicable and why. Suggest improvements without changing it automatically.")} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/20 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-200/[.06]"><CircleHelp className="size-3.5"/> Ask AcademicLab</button></div></div>{showAddSection && <div className="mt-4 flex gap-2"><input value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustomSection()} placeholder="e.g. Theoretical framework" className="rf-field"/><button onClick={addCustomSection} className="rounded-xl bg-emerald-300 px-4 text-sm font-semibold text-emerald-950">Add</button></div>}<div className="mt-4 space-y-2">{sections.map((section, index) => <div key={section.key} className="rf-choice flex items-center gap-3 rounded-xl p-3"><div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[.05] text-xs text-emerald-100/75">{String(index + 1).padStart(2, "0")}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{section.title}</p><p className="mt-0.5 text-xs leading-5 text-slate-300/50">{section.description}</p></div><div className="flex shrink-0 items-center gap-1"><button title="Move up" disabled={index === 0} onClick={() => moveSection(section.key, -1)} className="rounded-lg p-2 text-slate-300/55 hover:bg-white/[.06] disabled:opacity-20"><ChevronDown className="size-4 rotate-180"/></button><button title="Move down" disabled={index === sections.length - 1} onClick={() => moveSection(section.key, 1)} className="rounded-lg p-2 text-slate-300/55 hover:bg-white/[.06] disabled:opacity-20"><ChevronDown className="size-4"/></button><button title="Remove section" onClick={() => removeSection(section.key)} className="rounded-lg p-2 text-slate-300/45 hover:bg-rose-400/10 hover:text-rose-200"><X className="size-4"/></button></div></div>)}</div></div><div className="mt-5 flex flex-wrap justify-between gap-3"><button onClick={() => setStage("idea")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm text-white/70 hover:bg-white/[.05]"><ArrowLeft className="size-4"/> Back to idea</button><button onClick={openWorkspace} className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-300 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200">Enter research workspace <ArrowRight className="size-4"/></button></div></section>}

      {stage === "workspace" && <section className="rf-enter"><div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[.2em] text-emerald-200/70">Research workspace · {contextLabel}</p><input aria-label="Research project title" value={projectTitle} onChange={(e) => { setProjectTitle(e.target.value); setDirty(true) }} className="mt-2 w-full max-w-3xl border-0 border-b border-transparent bg-transparent p-0 text-2xl font-semibold tracking-tight text-white outline-none transition focus:border-emerald-200/40 sm:text-3xl"/><p className="mt-2 max-w-3xl text-sm text-slate-300/60">Work section by section. AcademicLab can guide you, but every research decision stays yours.</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => setPaperPanel("preview")} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/20 bg-emerald-200/[.06] px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-200/10"><FileText className="size-3.5"/> Preview full paper</button><button onClick={() => setPaperPanel("references")} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/[.06]"><BookOpen className="size-3.5"/> References & citations ({sources.length})</button><button onClick={() => setPaperPanel("evidence")} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/[.06]"><CheckCircle2 className="size-3.5"/> Evidence ({Object.values(sectionLogs as Record<string, SectionLog>).filter((log: SectionLog) => log.finalizedAt).length})</button><button onClick={() => { setLatexOpen(true); setCompileLog(""); void persist() }} className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-200/[.05] px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-200/10"><FileText className="size-3.5"/> Open LaTeX editor</button>{project?.id && <button onClick={() => { setCommunityBrief(project.brief || communityBrief); setCommunityMessage(""); setCommunityOpen(true) }} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/20 bg-emerald-200/[.05] px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-200/10">Submit for community review</button>}</div></div><div className="flex items-center gap-3"><div className="min-w-28"><div className="flex justify-between text-[10px] text-slate-300/55"><span>Draft progress</span><span>{progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-300 transition-all duration-500" style={{ width: `${progress}%` }}/></div></div><button onClick={() => void persist()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-3 text-xs font-semibold hover:bg-white/[.06]"><Save className="size-3.5"/> Save</button></div></div>
        <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]"><aside className="rf-panel rounded-2xl p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-200/70">Research map</p><h2 className="mt-1 font-semibold">Your paper</h2></div><button onClick={() => setStage("structure")} className="text-xs text-emerald-200 hover:text-emerald-100">Edit outline</button></div><div className="mt-4 space-y-1">{sections.map((section, index) => { const selected = section.key === activeSection; const done = !!section.content.trim(); return <button key={section.key} onClick={() => setActiveSection(section.key)} className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${selected ? "border border-emerald-200/20 bg-emerald-200/[.08]" : "border border-transparent hover:bg-white/[.04]"}`}><span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg text-[10px] ${done ? "bg-emerald-300/15 text-emerald-200" : selected ? "bg-emerald-300 text-emerald-950" : "bg-white/[.06] text-slate-300/55"}`}>{done ? <Check className="size-3.5"/> : index + 1}</span><span className="min-w-0 flex-1"><span className={`block text-xs font-medium ${selected ? "text-emerald-50" : "text-slate-200/75"}`}>{section.title}</span><span className="mt-1 block text-[10px] text-slate-300/40">{done ? "Draft started" : "Not started"}</span></span></button> })}</div><div className="mt-4 rounded-xl border border-white/[.07] bg-white/[.025] p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300/45">Research integrity</p><p className="mt-2 text-xs leading-5 text-slate-300/55">Keep actual observations separate from expectations. Add citations for claims based on other people's work.</p></div></aside>
          <div className="rf-panel min-w-0 rounded-2xl p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-200/70">Section {Math.max(1, sections.findIndex((s) => s.key === activeSection) + 1)} of {sections.length}</p><h2 className="mt-2 text-2xl font-semibold">{active?.title || "Research section"}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300/60">{active?.description}</p></div><span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-slate-300/55">{active?.content.trim() ? "Draft started" : "Ready to begin"}</span></div>{active?.key === "introduction" && <div className="mt-5 rounded-xl border border-emerald-200/10 bg-emerald-200/[.035] p-3 text-xs leading-5 text-emerald-50/70">A useful introduction usually establishes context, explains the problem, identifies what is not yet understood, and previews your question. You can refine this as your literature review develops.</div>}{active?.key === "hypothesis" && <div className="mt-5 rounded-xl border border-emerald-200/10 bg-emerald-200/[.035] p-3 text-xs leading-5 text-emerald-50/70">Not every project needs a formal hypothesis. For theoretical work or a literature review, a proposition or guiding question may be more appropriate.</div>}<label htmlFor="active-section-content" className="mt-6 block text-sm font-medium">Your draft</label><textarea ref={sectionRef} id="active-section-content" value={active?.content || ""} onChange={(e) => changeSectionContent(e.target.value)} disabled={!!sectionLogs[active?.key || ""]?.finalizedAt && !feedbackUnlocks.includes(active?.key || "")} rows={13} placeholder={`Start drafting ${active?.title?.toLowerCase() || "this section"}… Your writing autosaves to your account.`} className="rf-field mt-3 min-h-[280px]"/><div className="mt-5 rounded-xl border border-cyan-200/15 bg-cyan-200/[.035] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-cyan-100">Section evidence log</p><p className="mt-1 text-[11px] leading-5 text-slate-300/55">Record choices, sources used, experiments, revisions, or what changed your thinking. This log stays attached to this section.</p></div>{sectionLogs[active?.key || ""]?.finalizedAt ? <span className="rounded-full border border-emerald-200/20 px-2.5 py-1 text-[10px] text-emerald-100">Finalized · {new Date(sectionLogs[active?.key || ""]!.finalizedAt!).toLocaleDateString()}</span> : <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-slate-300/55">Draft evidence</span>}</div><textarea value={sectionLogs[active?.key || ""]?.notes || ""} onChange={(e) => active && updateSectionLog(active.key, e.target.value)} disabled={!!sectionLogs[active?.key || ""]?.finalizedAt && !feedbackUnlocks.includes(active?.key || "")} rows={3} placeholder="Why did you make these decisions? Which sources or results influenced this section? What did you revise?" className="rf-field mt-3 min-h-[88px] text-sm"/><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] text-slate-300/40">Finalizing locks this section until an eligible reviewer sends feedback on this exact section. After feedback arrives, you can revise and finalize it again.</p><div className="flex flex-wrap gap-2"><button onClick={() => active && addSectionLogEntry(active.key)} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-cyan-200/20 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-200/[.06]"><Plus className="size-3.5"/> Add log entry</button><button onClick={() => active && void finalizeSection(active)} disabled={finalizingSection === active?.key} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-cyan-200 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-100 disabled:opacity-50"><CheckCircle2 className="size-3.5"/>{finalizingSection === active?.key ? "Finalizing…" : sectionLogs[active?.key || ""]?.finalizedAt && !feedbackUnlocks.includes(active?.key || "") ? "Awaiting feedback" : sectionLogs[active?.key || ""]?.finalizedAt ? "Re-finalize section" : "Finalize section"}</button></div></div></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-[10px] text-slate-300/40">{(active?.content || "").trim().split(/\s+/).filter(Boolean).length} words · Autosave enabled</span><div className="flex gap-2"><button onClick={() => { setMentorOpen(true); void sendMentorMessage(`Review my current ${active?.title} draft. Give constructive, specific feedback and ask one useful question. Do not rewrite it without my approval.`) }} className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200/20 px-3 text-xs font-semibold text-emerald-100 hover:bg-emerald-200/[.06]"><MessageCircle className="size-3.5"/> Review with AcademicLab</button><button onClick={() => void persist()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-300 px-3 text-xs font-semibold text-emerald-950"><Save className="size-3.5"/> Save now</button></div></div><div className="mt-6 border-t border-white/[.08] pt-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-slate-200/70">Ask AcademicLab about this section</p><button onClick={() => setMentorOpen(true)} className="text-[10px] text-emerald-200 hover:underline">Open chat</button></div><div className="mt-3 flex flex-wrap gap-2">{promptSuggestions.map((prompt) => <button key={prompt} onClick={() => { setMentorOpen(true); void sendMentorMessage(prompt) }} className="rounded-full border border-white/10 bg-white/[.025] px-3 py-2 text-[11px] text-slate-200/70 transition hover:border-emerald-200/30 hover:bg-emerald-200/[.05]">{prompt}</button>)}</div></div><div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-white/[.08] pt-5"><button disabled={sections.findIndex((s) => s.key === activeSection) <= 0} onClick={() => setActiveSection(sections[Math.max(0, sections.findIndex((s) => s.key === activeSection) - 1)].key)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-xs font-semibold hover:bg-white/[.05] disabled:opacity-25"><ArrowLeft className="size-3.5"/> Previous section</button><button onClick={() => { const i = sections.findIndex((s) => s.key === activeSection); if (i < sections.length - 1) setActiveSection(sections[i + 1].key); else { setMentorOpen(true); void sendMentorMessage("Review my research outline and identify the most important next step based on the sections I've drafted.") } }} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-300 px-4 text-xs font-semibold text-emerald-950 hover:bg-emerald-200">{sections.findIndex((s) => s.key === activeSection) < sections.length - 1 ? "Next section" : "Plan next steps"}<ArrowRight className="size-3.5"/></button></div></div></div>
      </section>}
    </main>

    {latexOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-label="In-platform LaTeX editor"><div className="flex h-[96svh] w-full max-w-[1600px] flex-col overflow-hidden rounded-2xl border border-cyan-200/20 bg-[#081511] shadow-2xl"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-200/70">ResearchFolio · Typesetting workspace</p><h2 className="mt-1 text-lg font-semibold">LaTeX editor</h2><p className="mt-0.5 text-[11px] text-slate-300/50">Write and edit your .tex files inside FolioLabs. Source is autosaved with this project.</p></div><div className="flex flex-wrap items-center gap-2"><button onClick={() => void persist()} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/[.06]">Save</button><button onClick={downloadLatexProject} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/[.06]">Download source ZIP</button><button onClick={() => setLatexOpen(false)} aria-label="Close LaTeX editor" className="rounded-lg p-2 text-slate-300/70 hover:bg-white/[.06]"><X className="size-5"/></button></div></header><div className="grid min-h-0 flex-1 lg:grid-cols-[210px_minmax(0,1fr)_minmax(320px,.9fr)]"><aside className="border-b border-white/10 p-3 lg:border-b-0 lg:border-r"><div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300/50">Project files</p><button onClick={addLatexFile} className="rounded-md border border-white/15 px-2 py-1 text-[10px] hover:bg-white/[.06]">+ New file</button></div><div className="mt-3 flex gap-1 overflow-x-auto lg:flex-col">{latexFiles.map((file) => <button key={file.name} onClick={() => setLatexActiveFile(file.name)} className={`shrink-0 rounded-lg px-3 py-2 text-left text-xs ${latexActiveFile === file.name ? "bg-cyan-200/10 text-cyan-100 ring-1 ring-cyan-200/20" : "text-slate-300/65 hover:bg-white/[.04]"}`}><span className="block truncate">{file.name}</span></button>)}</div><div className="mt-5 rounded-xl border border-white/[.08] bg-white/[.025] p-3"><p className="text-[10px] font-semibold text-slate-200/75">How it works</p><p className="mt-2 text-[10px] leading-5 text-slate-300/50">Edit the source here, compile it to PDF, and keep the project files attached to your ResearchFolio project. Use relative file names in the root for now.</p></div></aside><section className="flex min-h-0 min-w-0 flex-col border-b border-white/10 lg:border-b-0 lg:border-r"><div className="flex items-center justify-between border-b border-white/[.08] px-3 py-2"><span className="text-xs font-medium text-slate-200/75">{activeLatexFile?.name || "No file selected"}</span><span className="text-[10px] text-slate-300/40">LaTeX source</span></div><textarea spellCheck={false} aria-label="LaTeX source code" value={activeLatexFile?.content || ""} onChange={(event) => updateLatexFile(event.target.value)} className="min-h-[280px] flex-1 resize-none bg-[#06100d] p-4 font-mono text-[12px] leading-6 text-emerald-50/90 outline-none placeholder:text-slate-500" placeholder="\documentclass{article}\n\begin{document}\nWrite your paper here…\n\end{document}" /></section><section className="flex min-h-[260px] min-w-0 flex-col"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[.08] px-3 py-2"><div><p className="text-xs font-semibold">PDF preview</p><p className="text-[10px] text-slate-300/40">Compile to refresh the output</p></div><button disabled={compileLoading} onClick={() => void compileLatex()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-200 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">{compileLoading ? <LoaderCircle className="size-3.5 animate-spin"/> : <FileText className="size-3.5"/>}{compileLoading ? "Compiling…" : "Compile PDF"}</button></div>{pdfUrl ? <iframe title="Compiled research paper PDF" src={pdfUrl} className="min-h-[220px] flex-1 bg-white" /> : <div className="flex flex-1 items-center justify-center bg-[#0a1712] p-6 text-center"><div><FileText className="mx-auto size-8 text-slate-300/20"/><p className="mt-3 text-sm font-medium text-slate-200/65">Your PDF will appear here</p><p className="mt-1 text-xs leading-5 text-slate-300/40">Edit main.tex and choose Compile PDF.</p></div></div>}{compileLog && <pre className="max-h-32 overflow-auto whitespace-pre-wrap border-t border-white/[.08] bg-black/20 p-3 text-[10px] leading-5 text-slate-300/65">{compileLog}</pre>}</section></div><footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-2 text-[10px] text-slate-300/40"><span>{latexFiles.length} project files · {saving ? "Saving…" : saveError ? "Save issue — retry Save" : lastSaved ? `Saved ${lastSaved}` : "Changes autosave"}</span><span>Compilation requires the FolioLabs LaTeX compiler service to be configured.</span></footer></div></div>}

    {paperPanel && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={paperPanel === "preview" ? "Full paper preview" : paperPanel === "references" ? "References and citation generator" : "Project evidence"}><div className="rf-scroll flex max-h-[92svh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-emerald-200/20 bg-[#0b1b17] shadow-2xl"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-200/70">ResearchFolio</p><h2 className="mt-1 text-lg font-semibold">{paperPanel === "preview" ? "Full paper preview" : paperPanel === "references" ? "References & citation generator" : "Project evidence"}</h2></div><button onClick={() => setPaperPanel(null)} className="rounded-lg p-2 text-slate-300/70 hover:bg-white/[.06]" aria-label="Close panel"><X className="size-5"/></button></div>
      {paperPanel === "preview" && <div className="rf-scroll overflow-y-auto p-5 sm:p-8"><div className="mx-auto max-w-3xl rounded-lg bg-[#fdfcf8] px-6 py-8 text-slate-900 shadow-xl sm:px-12 sm:py-12"><p className="text-center text-xs uppercase tracking-widest text-slate-500">ResearchFolio · Draft preview</p><h1 className="mt-5 text-center text-3xl font-semibold">{projectTitle}</h1>{idea && <p className="mt-5 text-center text-sm italic text-slate-600">Research focus: {idea}</p>}{sections.map((section) => <article key={section.key} className="mt-8"><h2 className="border-b border-slate-200 pb-2 text-xl font-semibold">{section.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7">{section.content.trim() || <span className="italic text-slate-400">[This section has not been drafted yet.]</span>}</p></article>)}{sources.length > 0 && <article className="mt-8"><h2 className="border-b border-slate-200 pb-2 text-xl font-semibold">Generated references</h2>{sources.map((source) => <p key={source.id} className="mt-3 break-words text-sm leading-7">{source.apa}</p>)}</article>}</div><div className="mt-4 flex flex-wrap justify-end gap-2"><button onClick={() => { const blob = new Blob([paperText()], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "research-paper-preview.txt"; a.click(); URL.revokeObjectURL(url) }} className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold hover:bg-white/[.06]">Download text preview</button><button onClick={() => { setPaperPanel(null); setLatexOpen(true); setCompileLog("") }} className="rounded-xl bg-emerald-300 px-4 py-2.5 text-xs font-semibold text-emerald-950">Continue in LaTeX editor</button></div></div>}
      {paperPanel === "references" && <div className="rf-scroll grid gap-5 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><div><h3 className="font-semibold">Add a source</h3><p className="mt-1 text-xs leading-5 text-slate-300/55">Enter the metadata from the actual paper or source. Citations are formatted from the details you provide; they are not independently verified.</p><div className="mt-4 space-y-3"><label className="block text-xs text-slate-300/70">Title<input value={sourceTitle} onChange={(e) => setSourceTitle(e.target.value)} className="rf-field mt-1" placeholder="Title of paper or book"/></label><label className="block text-xs text-slate-300/70">Author(s)<input value={sourceAuthors} onChange={(e) => setSourceAuthors(e.target.value)} className="rf-field mt-1" placeholder="e.g. Jane Smith, Robert Lee"/></label><div className="grid grid-cols-2 gap-3"><label className="block text-xs text-slate-300/70">Year<input value={sourceYear} onChange={(e) => setSourceYear(e.target.value)} className="rf-field mt-1" placeholder="2025"/></label><label className="block text-xs text-slate-300/70">Journal / publisher<input value={sourcePublication} onChange={(e) => setSourcePublication(e.target.value)} className="rf-field mt-1" placeholder="Journal or publisher"/></label></div><label className="block text-xs text-slate-300/70">DOI<input value={sourceDoi} onChange={(e) => setSourceDoi(e.target.value)} className="rf-field mt-1" placeholder="10.xxxx/xxxxx"/></label><label className="block text-xs text-slate-300/70">URL (optional)<input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className="rf-field mt-1" placeholder="https://…"/></label><button onClick={makeCitation} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-xs font-semibold text-emerald-950"><Plus className="size-3.5"/> Generate citation & add source</button></div></div><div><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Project reference list ({sources.length})</h3><select value={citationStyle} onChange={(e) => setCitationStyle(e.target.value as "APA 7" | "BibTeX")} className="rounded-lg border border-white/15 bg-[#10251f] px-3 py-2 text-xs"><option>APA 7</option><option>BibTeX</option></select></div>{sources.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-white/15 p-5 text-sm text-slate-300/50">No sources added yet. Add one using the form.</p> : <div className="mt-3 space-y-3">{sources.map((source) => <div key={source.id} className="rounded-xl border border-white/10 bg-white/[.025] p-3"><p className="text-sm font-medium">{source.title}</p><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-slate-200/70">{citationStyle === "APA 7" ? source.apa : source.bibtex}</p><div className="mt-2 flex justify-end gap-2"><button onClick={() => void navigator.clipboard?.writeText(citationStyle === "APA 7" ? source.apa : source.bibtex)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] hover:bg-white/[.06]">Copy</button><button onClick={() => { setSources((current) => current.filter((item) => item.id !== source.id)); setDirty(true) }} className="rounded-lg border border-rose-200/15 px-2.5 py-1.5 text-[10px] text-rose-100/80 hover:bg-rose-200/[.06]">Remove</button></div></div>)}</div>}<div className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/[.04] p-3 text-[11px] leading-5 text-amber-100/70">Citation formatting is a helpful starting point, not a guarantee of perfect style compliance. Confirm author order, capitalization, publication details, and DOI against the source.</div></div><div className="lg:col-span-2 flex justify-end"><button onClick={() => { setPaperPanel(null); void persist() }} className="rounded-xl bg-emerald-300 px-4 py-2.5 text-xs font-semibold text-emerald-950">Save references</button></div></div>}
      {paperPanel === "evidence" && <div className="rf-scroll overflow-y-auto p-5"><p className="max-w-3xl text-sm leading-6 text-slate-300/65">Finalized sections are snapshotted here with their evidence notes and timestamp. This is an evidence trail for review, not an automatic proof of independent authorship.</p><div className="mt-5 space-y-3">{sections.filter((section) => sectionLogs[section.key]?.finalizedAt).map((section) => <article key={section.key} className="rounded-xl border border-emerald-200/15 bg-emerald-200/[.035] p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{section.title}</h3><p className="mt-1 text-[10px] text-emerald-100/55">Finalized {new Date(sectionLogs[section.key].finalizedAt!).toLocaleString()}</p></div><button onClick={() => { setPaperPanel(null); setActiveSection(section.key) }} className="text-xs text-emerald-200 hover:underline">Open section</button></div><div className="mt-3 space-y-2">{(sectionLogs[section.key].entries || []).map((entry) => <div key={entry.id} className="rounded-lg bg-black/20 p-3"><p className="text-[10px] text-emerald-100/45">{new Date(entry.createdAt).toLocaleString()}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-200/75">{entry.text}</p></div>)}{sectionLogs[section.key].notes && <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200/75">{sectionLogs[section.key].notes}</p>}{!(sectionLogs[section.key].entries || []).length && !sectionLogs[section.key].notes && <p className="text-sm text-slate-300/50">No evidence notes added.</p>}</div><details className="mt-3"><summary className="cursor-pointer text-xs text-slate-300/60">View finalized section snapshot</summary><p className="mt-2 whitespace-pre-wrap rounded-lg bg-black/20 p-3 text-xs leading-6 text-slate-200/70">{sectionLogs[section.key].finalizedContent}</p></details></article>)}{!sections.some((section) => sectionLogs[section.key]?.finalizedAt) && <div className="rounded-xl border border-dashed border-white/15 p-8 text-center"><CheckCircle2 className="mx-auto size-8 text-emerald-200/50"/><p className="mt-3 text-sm font-medium">No finalized sections yet</p><p className="mt-1 text-xs text-slate-300/50">Add an evidence note and select “Finalize section” from a section editor.</p></div>}</div><div className="mt-5 flex justify-end"><button onClick={() => { setPaperPanel(null); void persist() }} className="rounded-xl bg-emerald-300 px-4 py-2.5 text-xs font-semibold text-emerald-950">Save evidence log</button></div></div>}
    </div></div>}

    {communityOpen && <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="community-review-title"><div className="w-full max-w-xl rounded-2xl border border-emerald-200/20 bg-[#0b1b17] p-5 shadow-2xl sm:p-6"><h2 id="community-review-title" className="text-lg font-semibold">Submit for community review</h2><p className="mt-2 text-sm leading-6 text-slate-300/65">Your project title, brief, topic, and section content will be visible to authenticated members who are eligible under the academic feedback hierarchy. Internal evidence logs, AI chat, and LaTeX source files are not included in the feed. You can continue editing after submission.</p><label className="mt-4 block text-sm font-medium">Public project brief<textarea value={communityBrief} onChange={e => setCommunityBrief(e.target.value)} rows={5} maxLength={1200} placeholder="Summarize your research question, approach, and what feedback would be most useful." className="rf-field mt-2" /></label>{communityMessage && <p role="status" className="mt-3 text-sm text-amber-100/80">{communityMessage}</p>}<div className="mt-5 flex flex-wrap justify-end gap-2"><button onClick={() => setCommunityOpen(false)} disabled={communityBusy} className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold hover:bg-white/[.06]">Cancel</button><button onClick={() => void submitCommunityReview()} disabled={communityBusy || communityBrief.trim().length < 20} className="rounded-xl bg-emerald-300 px-4 py-2.5 text-xs font-semibold text-emerald-950 disabled:opacity-50">{communityBusy ? "Submitting…" : "Publish for review"}</button></div></div></div>}

    {mentorOpen && <div className="fixed bottom-4 right-4 z-50 flex h-[min(680px,calc(100svh-32px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-emerald-200/20 bg-[#0b1b17]/95 shadow-[0_25px_100px_rgba(0,0,0,.55)] backdrop-blur-2xl sm:bottom-6 sm:right-6"><div className="flex items-center justify-between border-b border-white/10 px-4 py-4"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200"><Sparkles className="size-4"/></div><div><p className="text-sm font-semibold">AcademicLab</p><p className="text-[10px] text-emerald-100/50">Research mentor · {active?.title || "Project setup"}</p></div></div><button onClick={() => setMentorOpen(false)} aria-label="Close AcademicLab" className="rounded-lg p-2 text-slate-300/60 hover:bg-white/[.06]"><X className="size-4"/></button></div><div className="rf-scroll flex-1 space-y-3 overflow-y-auto p-4">{chatMessages.map((message, index) => <div key={`${index}-${message.role}`} className={`max-w-[94%] rounded-2xl px-3.5 py-3 text-xs leading-6 ${message.role === "user" ? "ml-auto bg-emerald-300 text-emerald-950" : "border border-white/[.08] bg-white/[.04] text-slate-100/85"}`}><p className="whitespace-pre-wrap">{message.content}</p>{message.role === "assistant" && index > 0 && <button onClick={() => { if (active) { changeSectionContent(`${active.content}${active.content ? "\n\n" : ""}${message.content}`) } }} className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-200 hover:underline"><Plus className="size-3"/> Add response to current draft</button>}</div>)}{chatLoading && <div className="flex items-center gap-2 text-xs text-emerald-100/55"><LoaderCircle className="size-3.5 animate-spin"/> Thinking through your question…</div>}</div><div className="border-t border-white/10 p-3"><div className="mb-3 flex flex-wrap gap-1.5">{promptSuggestions.slice(0, 3).map((prompt) => <button key={prompt} onClick={() => void sendMentorMessage(prompt)} className="rounded-full border border-emerald-200/15 px-2.5 py-1.5 text-[10px] text-emerald-100/70 hover:bg-emerald-200/[.06]">{prompt}</button>)}</div><form onSubmit={(e) => { e.preventDefault(); void sendMentorMessage() }} className="flex items-end gap-2"><textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} rows={2} placeholder="Ask about your research…" className="rf-field min-h-[48px] flex-1 resize-none text-xs"/><button disabled={!chatInput.trim() || chatLoading} type="submit" aria-label="Send message" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-300 text-emerald-950 disabled:opacity-40"><Send className="size-4"/></button></form><p className="mt-2 text-[9px] text-slate-300/35">AI suggestions may be wrong. Verify sources and keep real findings distinct from drafts.</p></div></div>}
    {!mentorOpen && <button onClick={() => setMentorOpen(true)} className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full border border-emerald-200/25 bg-[#0b1b17]/95 px-4 text-sm font-semibold text-emerald-100 shadow-[0_10px_40px_rgba(0,0,0,.35)] backdrop-blur-xl transition hover:border-emerald-200/50 hover:bg-[#10271f] sm:bottom-7 sm:right-7"><MessageCircle className="size-4"/> AcademicLab <span className="size-1.5 rounded-full bg-emerald-300"/></button>}
  </div>
}
