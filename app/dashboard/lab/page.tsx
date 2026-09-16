"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BookOpen,
  Check,
  ChevronDown,
  FlaskConical,
  Info,
  Play,
  RotateCcw,
  Sparkles,
  Video,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type TopicId = "eigenvalues" | "eigenvector-centrality"

type Evidence = {
  id: string
  topicId: TopicId
  topicName: string
  reflection: string
  matrix: number[][]
  eigenvalue: number
  eigenvector: number[]
  createdAt: string
}

const TOPICS: {
  id: TopicId
  name: string
  description: string
  available: boolean
}[] = [
  {
    id: "eigenvalues",
    name: "Eigenvalues & Eigenvectors",
    description:
      "Explore how a matrix transforms vectors and discover its dominant eigenvalue and eigenvector.",
    available: true,
  },
  {
    id: "eigenvector-centrality",
    name: "Eigenvector Centrality",
    description:
      "Understand how eigenvectors can identify influential nodes in a network.",
    available: false,
  },
]

const DEFAULT_MATRIX = [
  [2.5, 0.8, 0.3, 0.1, 0.2],
  [0.8, 1.8, 0.5, 0.2, 0.1],
  [0.3, 0.5, 1.2, 0.4, 0.6],
  [0.1, 0.2, 0.4, 0.9, 0.3],
  [0.2, 0.1, 0.6, 0.3, 1.1],
]

/*
 * Add your AI-generated video URL here later.
 *
 * Example:
 * const VIDEO_URL = "https://your-video-url.mp4"
 *
 * For now, leaving this empty shows a visual placeholder.
 */
const VIDEO_URL = ""

function multiplyMatrixVector(matrix: number[][], vector: number[]) {
  return matrix.map((row) =>
    row.reduce((sum, value, index) => sum + value * vector[index], 0)
  )
}

/*
 * Power iteration:
 * Repeatedly applies A to a vector.
 *
 * This gives us the dominant eigenvector and
 * an approximation of the dominant eigenvalue.
 */
function calculateDominantEigenpair(matrix: number[][]) {
  const size = matrix.length

  let vector = Array(size).fill(1 / Math.sqrt(size))

  for (let iteration = 0; iteration < 100; iteration++) {
    const next = multiplyMatrixVector(matrix, vector)

    const magnitude = Math.sqrt(
      next.reduce((sum, value) => sum + value * value, 0)
    )

    if (magnitude === 0) {
      break
    }

    vector = next.map((value) => value / magnitude)
  }

  const Av = multiplyMatrixVector(matrix, vector)

  const numerator = vector.reduce(
    (sum, value, index) => sum + value * Av[index],
    0
  )

  const denominator = vector.reduce(
    (sum, value) => sum + value * value,
    0
  )

  const eigenvalue = denominator === 0 ? 0 : numerator / denominator

  /*
   * Make the dominant component positive so the displayed
   * vector is easier for students to interpret.
   */
  const largestIndex = vector.reduce(
    (best, value, index) =>
      Math.abs(value) > Math.abs(vector[best]) ? index : best,
    0
  )

  if (vector[largestIndex] < 0) {
    vector = vector.map((value) => -value)
  }

  return {
    eigenvalue,
    eigenvector: vector,
  }
}

export default function LabPage() {
  const [selectedTopic, setSelectedTopic] =
    useState<TopicId>("eigenvalues")

  const [values, setValues] = useState<number[][]>(DEFAULT_MATRIX)

  const [hasRun, setHasRun] = useState(false)

  const [reasoning, setReasoning] = useState("")

  const [evidence, setEvidence] = useState<Evidence[]>([])

  const [videoPlaying, setVideoPlaying] = useState(false)

  /*
   * Load prototype evidence from localStorage.
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("foliolabs-learning-evidence")

      if (stored) {
        setEvidence(JSON.parse(stored))
      }
    } catch {
      setEvidence([])
    }
  }, [])

  /*
   * Only show evidence belonging to the selected topic.
   */
  const topicEvidence = useMemo(
    () => evidence.filter((item) => item.topicId === selectedTopic),
    [evidence, selectedTopic]
  )

  const selectedTopicData = TOPICS.find(
    (topic) => topic.id === selectedTopic
  )!

  const result = useMemo(
    () => calculateDominantEigenpair(values),
    [values]
  )

  function updateCell(row: number, col: number, value: string) {
    const numericValue = Number(value)

    setValues((current) =>
      current.map((matrixRow, rowIndex) =>
        matrixRow.map((cell, colIndex) =>
          rowIndex === row && colIndex === col
            ? Number.isFinite(numericValue)
              ? numericValue
              : 0
            : cell
        )
      )
    )

    setHasRun(false)
  }

  function resetMatrix() {
    setValues(DEFAULT_MATRIX.map((row) => [...row]))
    setHasRun(false)
  }

  function runExperiment() {
    setHasRun(true)
  }

  function saveEvidence() {
    if (!reasoning.trim()) {
      return
    }

    const newEvidence: Evidence = {
      id: `evidence-${Date.now()}`,
      topicId: selectedTopic,
      topicName: selectedTopicData.name,
      reflection: reasoning.trim(),
      matrix: values.map((row) => [...row]),
      eigenvalue: result.eigenvalue,
      eigenvector: [...result.eigenvector],
      createdAt: new Date().toISOString(),
    }

    const updatedEvidence = [newEvidence, ...evidence]

    setEvidence(updatedEvidence)

    localStorage.setItem(
      "foliolabs-learning-evidence",
      JSON.stringify(updatedEvidence)
    )

    setReasoning("")
    setHasRun(true)
  }

  function deleteEvidence(id: string) {
    const updatedEvidence = evidence.filter((item) => item.id !== id)

    setEvidence(updatedEvidence)

    localStorage.setItem(
      "foliolabs-learning-evidence",
      JSON.stringify(updatedEvidence)
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">

      {/* =========================================================
          HEADER + TOPIC SELECTOR
      ========================================================== */}

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <FlaskConical className="size-4" />
              Learning Lab
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Learn by experimenting.
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Explore a concept, run the simulation, explain what you
              discovered, and turn your thinking into learning evidence.
            </p>
          </div>

          {/* Topic dropdown */}

          <div className="w-full lg:w-80">
            <label
              htmlFor="topic"
              className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
            >
              Learning topic
            </label>

            <div className="relative">
              <select
                id="topic"
                value={selectedTopic}
                onChange={(event) =>
                  setSelectedTopic(event.target.value as TopicId)
                }
                className="h-11 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {TOPICS.map((topic) => (
                  <option
                    key={topic.id}
                    value={topic.id}
                    disabled={!topic.available}
                  >
                    {topic.name}
                    {!topic.available ? " · Coming soon" : ""}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

        </div>
      </section>


      {/* =========================================================
          TOPIC INTRODUCTION
      ========================================================== */}

      <section className="grid gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <BookOpen className="size-4" />
            Introduction
          </div>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Eigenvalues & Eigenvectors
          </h2>

          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            When a matrix acts on a vector, it usually changes both the
            vector's direction and magnitude. An eigenvector is a special
            vector whose direction stays unchanged when the matrix
            transforms it. The corresponding eigenvalue tells us how much
            that vector is stretched or compressed.
          </p>

          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-mono text-sm text-foreground">
              A v = λ v
            </p>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              A = matrix · v = eigenvector · λ = eigenvalue
            </p>
          </div>
        </div>


        <div className="rounded-2xl border border-border bg-card p-6">

          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Info className="size-4" />
            Important
          </div>

          <div className="mt-5 flex flex-col gap-4">

            <div>
              <p className="text-sm font-medium">Eigenvector</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                A direction that remains unchanged by the transformation.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Eigenvalue</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Describes how strongly the eigenvector is scaled.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Dominant eigenvalue</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                The eigenvalue with the greatest magnitude.
              </p>
            </div>

          </div>
        </div>

      </section>


      {/* =========================================================
          ABOUT
      ========================================================== */}

      <section className="rounded-2xl border border-border bg-secondary/20 p-6 sm:p-8">

        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="size-4" />
          About this simulation
        </div>

        <div className="mt-4 grid gap-6 md:grid-cols-2">

          <div>
            <h3 className="font-medium">What are you exploring?</h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              You will change the entries of a matrix and observe how its
              dominant eigenvalue and eigenvector change. The goal is not
              just to get a numerical answer, but to understand the
              relationship between the matrix and its special directions.
            </p>
          </div>

          <div>
            <h3 className="font-medium">How does it work?</h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This prototype uses power iteration. It repeatedly applies
              the matrix to a vector and normalizes the result. After
              enough iterations, the vector approaches the dominant
              eigenvector.
            </p>
          </div>

        </div>
      </section>


      {/* =========================================================
          SIMULATION
      ========================================================== */}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

        {/* MATRIX */}

        <div className="rounded-2xl border border-border bg-card p-6">

          <div className="flex items-center justify-between">

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">
                  Interactive simulation
                </h2>

                {hasRun && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                    <Check className="size-3" />
                    Experiment run
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Change the matrix values and run the experiment.
              </p>
            </div>

            <FlaskConical className="size-5 text-primary" />

          </div>


          <div className="mt-6 overflow-x-auto">

            <div
              className="grid w-fit gap-2"
              style={{
                gridTemplateColumns: `repeat(${values[0].length}, minmax(58px, 1fr))`,
              }}
            >

              {values.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <Input
                    key={`${rowIndex}-${colIndex}`}
                    value={cell}
                    type="number"
                    step="0.1"
                    onChange={(event) =>
                      updateCell(
                        rowIndex,
                        colIndex,
                        event.target.value
                      )
                    }
                    className="h-12 w-16 text-center font-mono"
                    aria-label={`Matrix row ${
                      rowIndex + 1
                    } column ${colIndex + 1}`}
                  />
                ))
              )}

            </div>

          </div>


          <div className="mt-6 flex flex-wrap gap-3">

            <Button onClick={runExperiment}>
              <Play className="size-4" />
              Run experiment
            </Button>

            <Button
              variant="outline"
              onClick={resetMatrix}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>

          </div>

        </div>


        {/* RESULT */}

        <div className="rounded-2xl border border-border bg-card p-6">

          <p className="text-sm text-muted-foreground">
            Dominant eigenvalue
          </p>

          <p className="mt-3 text-4xl font-semibold tracking-tight">
            λ₁ = {result.eigenvalue.toFixed(4)}
          </p>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The dominant eigenvector shows the direction that is most
            strongly preserved by this matrix transformation.
          </p>


          <div className="mt-7">

            <p className="mb-4 text-sm font-medium">
              Dominant eigenvector
            </p>

            <div className="flex flex-col gap-3">

              {result.eigenvector.map((value, index) => {

                const width = Math.min(
                  Math.abs(value) * 100,
                  100
                )

                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-sm"
                  >

                    <span className="w-14 shrink-0 text-muted-foreground">
                      v{index + 1}
                    </span>

                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>

                    <span className="w-16 text-right font-mono text-xs">
                      {value.toFixed(4)}
                    </span>

                  </div>
                )
              })}

            </div>
          </div>


          <div className="mt-7 rounded-xl border border-border bg-secondary/30 p-4">

            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              What to notice
            </p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Try changing one matrix value at a time. Observe how the
              dominant eigenvalue and the relative components of the
              eigenvector respond.
            </p>

          </div>

        </div>

      </section>


      {/* =========================================================
          VIDEO
      ========================================================== */}

      <section className="overflow-hidden rounded-2xl border border-primary/20 bg-primary/5">

        <div className="grid gap-6 p-6 md:grid-cols-[0.85fr_1.15fr] md:p-8">

          <div>

            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-primary">
              <Video className="size-4" />
              Visual explanation
            </div>

            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              See eigenvectors visually.
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A short visual explanation will show how a matrix
              transforms vectors and why eigenvectors are special.
            </p>

            <div className="mt-5 rounded-xl border border-border bg-background/70 p-4">

              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Video
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Your AI-generated explanation can be added here later.
              </p>

            </div>

          </div>


          <div className="relative min-h-64 overflow-hidden rounded-xl border border-border bg-background">

            {VIDEO_URL ? (
              <video
                src={VIDEO_URL}
                controls
                className="h-full min-h-64 w-full object-cover"
              />
            ) : (
              <>

                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, rgba(120,120,120,.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,120,120,.12) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                  }}
                />

                <div className="relative flex min-h-64 items-center justify-center">

                  <div className="absolute left-[18%] top-[30%] size-4 rounded-full bg-primary shadow-[0_0_25px_rgba(100,220,160,.7)]" />

                  <div className="absolute left-[43%] top-[48%] size-7 rounded-full bg-primary shadow-[0_0_30px_rgba(100,220,160,.8)]" />

                  <div className="absolute right-[20%] top-[27%] size-3 rounded-full bg-primary/70" />

                  <div className="absolute bottom-[20%] right-[32%] size-4 rounded-full bg-primary/80" />

                  <div className="absolute left-[20%] top-[36%] h-px w-[25%] rotate-[20deg] bg-primary/50" />

                  <div className="absolute left-[48%] top-[46%] h-px w-[28%] -rotate-[22deg] bg-primary/50" />

                  <button
                    type="button"
                    onClick={() =>
                      setVideoPlaying((current) => !current)
                    }
                    className={`relative z-10 flex size-16 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-primary transition-transform hover:scale-105 ${
                      videoPlaying ? "animate-pulse" : ""
                    }`}
                    aria-label="Play visual explanation"
                  >
                    <Play className="ml-1 size-6 fill-current" />
                  </button>

                </div>

                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-border bg-background/90 px-4 py-3 text-xs text-muted-foreground">

                  <span>
                    {videoPlaying
                      ? "Playing visual explanation"
                      : "AI video coming soon"}
                  </span>

                  <span>02:14</span>

                </div>

              </>
            )}

          </div>

        </div>

      </section>


      {/* =========================================================
          CAPTURE EVIDENCE
      ========================================================== */}

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <BookOpen className="size-4" />
              Capture Evidence
            </div>

            <h2 className="mt-2 text-xl font-semibold">
              Make your learning visible.
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Explain what you discovered, what surprised you, and what
              you would investigate next. Your response will be saved
              under the selected topic.
            </p>

          </div>

          {topicEvidence.length > 0 && (
            <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              {topicEvidence.length} evidence{" "}
              {topicEvidence.length === 1 ? "item" : "items"}
            </span>
          )}

        </div>


        <div className="mt-6 rounded-xl border border-border bg-secondary/20 p-4">

          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Evidence will be saved to
          </p>

          <p className="mt-1 text-sm font-medium">
            {selectedTopicData.name}
          </p>

        </div>


        <textarea
          value={reasoning}
          onChange={(event) => setReasoning(event.target.value)}
          placeholder="I noticed that...

For example:
• When I increased this matrix value...
• The dominant eigenvalue changed because...
• The eigenvector tells me...
• Something I would test next is..."
          className="mt-5 min-h-40 w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />


        <div className="mt-4 flex flex-wrap items-center gap-3">

          <Button
            onClick={saveEvidence}
            disabled={!reasoning.trim()}
          >
            <Check className="size-4" />
            Save as evidence
          </Button>

          <p className="text-xs text-muted-foreground">
            Your simulation result will be attached automatically.
          </p>

        </div>

      </section>


      {/* =========================================================
          SAVED EVIDENCE
      ========================================================== */}

      <section className="rounded-2xl border border-border bg-card">

        <div className="border-b border-border p-6">

          <div className="flex items-center gap-2">

            <h2 className="font-semibold">
              My evidence
            </h2>

            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
              {selectedTopicData.name}
            </span>

          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Evidence captured while learning this topic.
          </p>

        </div>


        {topicEvidence.length === 0 ? (

          <div className="p-8 text-center">

            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
              <BookOpen className="size-5 text-muted-foreground" />
            </div>

            <p className="mt-4 text-sm font-medium">
              No evidence captured yet.
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Run the experiment and write your reflection above.
            </p>

          </div>

        ) : (

          <div className="flex flex-col">

            {topicEvidence.map((item) => (

              <article
                key={item.id}
                className="border-b border-border p-6 last:border-0"
              >

                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                        <Check className="size-3" />
                        Evidence captured
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>

                    </div>


                    <p className="mt-4 text-sm leading-7 text-foreground">
                      {item.reflection}
                    </p>


                    <div className="mt-5 grid gap-3 sm:grid-cols-2">

                      <div className="rounded-xl border border-border bg-secondary/20 p-4">

                        <p className="text-xs text-muted-foreground">
                          Dominant eigenvalue
                        </p>

                        <p className="mt-2 font-mono text-sm font-medium">
                          {item.eigenvalue.toFixed(4)}
                        </p>

                      </div>


                      <div className="rounded-xl border border-border bg-secondary/20 p-4">

                        <p className="text-xs text-muted-foreground">
                          Eigenvector
                        </p>

                        <p className="mt-2 font-mono text-xs leading-6">
                          [
                          {item.eigenvector
                            .map((value) => value.toFixed(3))
                            .join(", ")}
                          ]
                        </p>

                      </div>

                    </div>

                  </div>


                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEvidence(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Delete
                  </Button>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>


      {/* =========================================================
          FUTURE TOPICS
      ========================================================== */}

      <section className="rounded-2xl border border-dashed border-border bg-card/50 p-6">

        <div className="flex items-center gap-3">

          <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
            <Sparkles className="size-4 text-primary" />
          </div>

          <div>

            <p className="text-sm font-medium">
              More learning topics
            </p>

            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Add more simulations later without changing the evidence
              structure. Each topic gets its own evidence stream.
            </p>

          </div>

        </div>

      </section>

    </div>
  )
}