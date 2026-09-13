'use client'

import { useState } from 'react'
import { Check, FlaskConical, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { demoLabExperiments } from '@/lib/demo-data'

export default function LabPage() {
  const [values, setValues] = useState(demoLabExperiments[0].matrixData?.values ?? [])
  const [recorded, setRecorded] = useState(false)
  const [reasoning, setReasoning] = useState('')
  const updateCell = (row: number, col: number, value: string) => setValues((current) => current.map((r, rIndex) => r.map((cell, cIndex) => (rIndex === row && cIndex === col ? Number(value) || 0 : cell))))
  return <div className="mx-auto max-w-6xl flex flex-col gap-8">
    <div><p className="text-sm text-primary">Learning Lab · Eigenvector Exploration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Make your thinking visible.</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Run an experiment, inspect the result, then capture the reasoning that turns an output into learning evidence.</p></div>
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-border bg-card p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Matrix input</h2><p className="mt-1 text-sm text-muted-foreground">Edit the adjacency matrix for your network.</p></div><FlaskConical className="size-5 text-primary" /></div><div className="mt-6 grid max-w-sm grid-cols-5 gap-2">{values.map((row, rowIndex) => row.map((cell, colIndex) => <Input key={`${rowIndex}-${colIndex}`} value={cell} onChange={(event) => updateCell(rowIndex, colIndex, event.target.value)} className="h-12 text-center font-mono" aria-label={`Matrix row ${rowIndex + 1} column ${colIndex + 1}`} />))}</div><div className="mt-6 flex gap-3"><Button onClick={() => setRecorded(true)}><Play className="size-4" />Run experiment</Button><Button variant="outline" onClick={() => setValues(demoLabExperiments[0].matrixData?.values ?? [])}><RotateCcw className="size-4" />Reset</Button></div></div>
      <div className="rounded-2xl border border-border bg-card p-6"><p className="text-sm text-muted-foreground">Computed result</p><p className="mt-4 text-4xl font-semibold">λ₁ = 4.20</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">The dominant eigenvector highlights the most influential nodes in your network.</p><div className="mt-6 flex flex-col gap-3">{[0.58, 0.42, 0.31, 0.15, 0.18].map((value, index) => <div key={index} className="flex items-center gap-3 text-sm"><span className="w-12 text-muted-foreground">Node {index + 1}</span><div className="h-2 flex-1 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${value * 100}%` }} /></div><span className="font-mono text-xs">{value}</span></div>)}</div></div>
    </section>
    <section className="rounded-2xl border border-border bg-card p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Capture your reasoning</h2><p className="mt-1 text-sm text-muted-foreground">What does this result tell you, and what would you test next?</p></div>{recorded && <span className="flex items-center gap-1 text-sm text-primary"><Check className="size-4" /> Experiment recorded</span>}</div><textarea value={reasoning} onChange={(event) => setReasoning(event.target.value)} placeholder="I notice that..." className="mt-6 min-h-32 w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" /><Button className="mt-4" onClick={() => setRecorded(true)}>Save as evidence</Button></section>
  </div>
}
