"use client"

import { useState } from "react"
import { BrainCircuit, Send, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { askMentor, type MentorMode } from "@/lib/ai"

export default function MentorPage() {
  const [message, setMessage] = useState("")
  const [reply, setReply] = useState("Ask a question about your current experiment and I will guide your reasoning without giving away the answer.")
  const [mode, setMode] = useState<MentorMode>("hint")
  async function ask() { if (!message.trim()) return; const result = await askMentor({ message, mode, context: "Eigenvector Exploration" }); setReply(result.text); setMessage("") }
  return <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6"><div><p className="text-sm font-medium text-primary">Learn & Build / AI Mentor</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Think with a Socratic mentor</h1><p className="mt-2 text-muted-foreground">Guidance grounded in your experiments, decisions, and reflections.</p></div><Card className="max-w-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit className="size-5 text-primary" />Mentor session <span className="ml-auto text-xs font-normal text-muted-foreground">Evidence recording on</span></CardTitle></CardHeader><CardContent className="flex flex-col gap-5"><div className="rounded-xl border border-primary/20 bg-primary/5 p-5"><div className="flex gap-3"><Sparkles className="mt-1 size-5 shrink-0 text-primary" /><p className="leading-relaxed text-foreground">{reply}</p></div></div><div className="flex flex-wrap gap-2">{(["hint", "explain", "example"] as MentorMode[]).map((item) => <Button key={item} size="sm" variant={mode === item ? "default" : "outline"} onClick={() => setMode(item)}>{item === "hint" ? "Give me a hint" : item === "explain" ? "Explain the concept" : "Give me an example"}</Button>)}</div><div className="flex gap-2"><Input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229) ask() }} placeholder="What are you noticing in the experiment?" /><Button onClick={ask} aria-label="Ask mentor"><Send data-icon="inline-start" />Ask</Button></div><p className="text-xs text-muted-foreground">Each interaction is recorded as learning evidence.</p></CardContent></Card></main>
}
