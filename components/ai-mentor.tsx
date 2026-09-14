"use client"

import { useRef, useState } from "react"
import { ImagePlus, Send, X, Sparkles, Loader2 } from "lucide-react"

type Message = {
  role: "user" | "assistant"
  content: string
}

type AIMentorProps = {
  subject?: string
  topic?: string
}

export default function AIMentor({
  subject = "General",
  topic = "General",
}: AIMentorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I'm your FolioLabs AI Mentor. I won't give you the answer — I'll help you figure it out. What are you working on?",
    },
  ])

  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState<{
    data: string
    mimeType: string
    preview: string
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith("image/")) {
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please upload an image smaller than 5MB.")
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result as string

      const base64 = result.split(",")[1]

      setImage({
        data: base64,
        mimeType: file.type,
        preview: result,
      })
    }

    reader.readAsDataURL(file)
  }

  async function sendMessage() {
    const text = input.trim()

    if (!text || loading) return

    const userMessage: Message = {
      role: "user",
      content: text,
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
          message: text,
          history: messages,
          subject,
          topic,
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
        throw new Error(data.error || "Something went wrong.")
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
}
    finally {
      setLoading(false)
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-full min-h-[600px] flex-col overflow-hidden rounded-2xl border bg-background">

      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold">AI Mentor</h2>
            <p className="text-xs text-muted-foreground">
              Think it through. Don't just get the answer.
            </p>
          </div>
        </div>

        <div className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
          {subject}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-5 overflow-y-auto p-5">

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
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking about how to guide you...
            </div>
          </div>
        )}

      </div>

      {/* Image Preview */}
      {image && (
        <div className="border-t px-5 py-3">
          <div className="relative inline-block">
            <img
              src={image.preview}
              alt="Uploaded question"
              className="h-20 w-20 rounded-lg border object-cover"
            />

            <button
              type="button"
              onClick={() => setImage(null)}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2 rounded-xl border p-2">

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-muted"
            title="Upload an image"
          >
            <ImagePlus className="h-5 w-5" />
          </button>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for a hint..."
            rows={1}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>

        </div>

        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          AI Mentor gives hints and guidance rather than doing the work for you.
        </p>
      </div>
    </div>
  )
}