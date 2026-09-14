"use client"

import { useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import {
  BrainCircuit,
  ImagePlus,
  Send,
  Sparkles,
  X,
} from "lucide-react"


type Message = {
  role: "user" | "assistant"
  content: string
}
function normalizeMath(text: string) {
  let result = text

  // Convert \[ ... \] → $$ ... $$
  result = result.replace(
    /\\\[\s*([\s\S]*?)\s*\\\]/g,
    (_, math) => `\n\n$$\n${math.trim()}\n$$\n\n`
  )

  // Convert \(...\) → $...$
  result = result.replace(
    /\\\(\s*(.*?)\s*\\\)/g,
    (_, math) => `$${math.trim()}$`
  )

  // Convert standalone [ ... ] math blocks → $$ ... $$
  result = result.replace(
    /^\s*\[\s*([^\[\]]+?)\s*\]\s*$/gm,
    (_, math) => `\n\n$$\n${math.trim()}\n$$\n\n`
  )

  // Convert simple parenthesized mathematical expressions
  // such as ( x^2 ) or ( f(x) = x^n )
  result = result.replace(
    /\(\s*([^()\n]*(?:\\[a-zA-Z]+|[\^_=]|[+\-*/])[^()\n]*)\s*\)/g,
    (_, math) => `$${math.trim()}$`
  )

  return result
}
export default function MentorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const [image, setImage] = useState<{
    data: string
    mimeType: string
    preview: string
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return

    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result !== "string") return

      const base64 = reader.result.split(",")[1]

      if (!base64) return

      setImage({
        data: base64,
        mimeType: file.type,
        preview: reader.result,
      })
    }

    reader.readAsDataURL(file)
  }

  const handleSend = async () => {
    const text = input.trim()

    if (!text && !image) return
    if (loading) return

    const userMessage: Message = {
      role: "user",
      content:
        text || "Please help me understand what is shown in this image.",
    }

    const updatedMessages = [...messages, userMessage]

    setMessages(updatedMessages)
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/ai/mentor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message:
            text ||
            "Look at this image and help me reason through what I am seeing.",
          history: messages,
          subject: "General",
          topic: "General",
          image: image
            ? {
                data: image.data,
                mimeType: image.mimeType,
              }
            : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "AI Mentor request failed.")
      }

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: data.response,
        },
      ])

      setImage(null)
    } catch (error) {
      console.error("AI Mentor error:", error)

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `AI Mentor error: ${error.message}`
              : "AI Mentor request failed.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (text: string) => {
    setInput(text)
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-full bg-[#080c0a] text-white">
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">

        {/* Breadcrumb */}
        <div className="text-sm text-[#8bd3a8]">
          Learn & Build /{" "}
          <span className="text-white/70">AI Mentor</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Think with a Socratic mentor
          </h1>

          <p className="mt-1 text-sm text-white/50">
            Guidance grounded in your experiments, decisions, and
            reflections.
          </p>
        </div>

        {/* Mentor Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0c1210] p-5 shadow-xl">

          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#8bd3a8]/20 bg-[#8bd3a8]/10">
                <BrainCircuit className="h-4 w-4 text-[#8bd3a8]" />
              </div>

              <div>
                <h2 className="text-sm font-medium">
                  Mentor session
                </h2>

                <p className="text-xs text-white/40">
                  Socratic guidance
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2 text-xs text-[#8bd3a8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8bd3a8]" />
              Evidence recording on
            </div>
          </div>

          {/* Intro */}
          <div className="mt-5 rounded-xl border border-[#8bd3a8]/10 bg-[#8bd3a8]/5 p-4">
            <div className="flex gap-3">

              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#8bd3a8]" />

              <p className="text-sm leading-6 text-white/70">
                Ask a question about your current experiment and I
                will guide your reasoning without giving away the
                answer.
              </p>

            </div>
          </div>

          {/* Conversation */}
          {messages.length > 0 && (
            <div className="mt-5 max-h-[420px] space-y-4 overflow-y-auto pr-1">

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                      message.role === "user"
                        ? "bg-[#8bd3a8] text-[#07100b]"
                        : "border border-white/10 bg-white/[0.03] text-white/75"
                    }`}
                  >

                    {message.role === "assistant" ? (
                      <div className="mentor-markdown">
<ReactMarkdown
  remarkPlugins={[remarkMath]}
  rehypePlugins={[rehypeKatex]}
>
  {normalizeMath(message.content)}
</ReactMarkdown>

                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}

                  </div>

                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/40">
                    Thinking...
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-5 flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() =>
                handleQuickAction(
                  "Give me a small hint without giving me the answer."
                )
              }
              className="rounded-lg border border-[#8bd3a8]/20 bg-[#8bd3a8]/10 px-3 py-2 text-xs font-medium text-[#8bd3a8] transition hover:bg-[#8bd3a8]/15"
            >
              Give me a hint
            </button>

            <button
              type="button"
              onClick={() =>
                handleQuickAction(
                  "Help me understand the concept without solving the problem for me."
                )
              }
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/65 transition hover:bg-white/[0.06]"
            >
              Explain the concept
            </button>

            <button
              type="button"
              onClick={() =>
                handleQuickAction(
                  "Give me a simple example that helps me understand this."
                )
              }
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/65 transition hover:bg-white/[0.06]"
            >
              Give me an example
            </button>

          </div>

          {/* Image Preview */}
          {image && (
            <div className="relative mt-4 inline-block">

              <img
                src={image.preview}
                alt="Selected image"
                className="max-h-40 max-w-xs rounded-xl border border-white/10 object-contain"
              />

              <button
                type="button"
                onClick={() => setImage(null)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#111814] text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>

            </div>
          )}

          {/* Input */}
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-[#080c0a] p-2">

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]

                if (file) {
                  handleImageSelect(file)
                }

                event.target.value = ""
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.05] hover:text-[#8bd3a8]"
              aria-label="Upload image"
              title="Upload image"
            >
              <ImagePlus className="h-[18px] w-[18px]" />
            </button>

            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What are you noticing in the experiment?"
              disabled={loading}
              className="min-w-0 flex-1 bg-transparent px-1 text-sm text-white outline-none placeholder:text-white/30 disabled:opacity-50"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={loading || (!input.trim() && !image)}
              className="flex h-9 items-center gap-2 rounded-lg bg-[#8bd3a8] px-3 text-xs font-semibold text-[#07100b] transition hover:bg-[#a0dfb8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>{loading ? "Thinking" : "Ask"}</span>
              <Send className="h-3.5 w-3.5" />
            </button>

          </div>

          {/* Footer */}
          <div className="mt-4 text-center text-xs text-white/30">
            Each interaction is recorded as learning evidence.
          </div>

        </div>
      </div>

      {/* Math / Markdown styling */}
      <style jsx global>{`
        .mentor-markdown {
          line-height: 1.7;
        }

        .mentor-markdown p {
          margin: 0 0 0.65rem;
        }

        .mentor-markdown p:last-child {
          margin-bottom: 0;
        }

        .mentor-markdown strong {
          font-weight: 600;
          color: white;
        }

        .mentor-markdown ul,
        .mentor-markdown ol {
          margin: 0.5rem 0;
          padding-left: 1.25rem;
        }

        .mentor-markdown li {
          margin: 0.25rem 0;
        }

        .mentor-markdown .katex-display {
          margin: 0.8rem 0;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 0.25rem 0;
        }

        .mentor-markdown .katex {
          font-size: 1.05em;
        }

        .mentor-markdown code {
          border-radius: 0.3rem;
          background: rgba(255, 255, 255, 0.06);
          padding: 0.1rem 0.3rem;
        }
      `}</style>
    </div>
  )
}