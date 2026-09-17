"use client"

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ImagePlus,
  MessageCircle,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type UserProfile = {
  id: string
  full_name: string | null
  role: string
}

type Conversation = {
  id: string
  otherUserId: string
  otherUser: UserProfile | null
  updated_at: string
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_at?: string | null
  message_type?: "text" | "image" | "mixed"
  image_path?: string | null
  image_url?: string | null
}

const MAX_IMAGE_SIZE = 8 * 1024 * 1024

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const initialUserId = searchParams.get("userId")

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState("")
  const [currentUserId, setCurrentUserId] = useState("")
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
  const [clearingChat, setClearingChat] = useState(false)
  const [error, setError] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const shouldScrollToBottom = useRef(true)

  async function loadCurrentUser() {
    try {
      const response = await fetch("/api/profile", { cache: "no-store" })
      if (!response.ok) return
      const data = await response.json()
      if (data.profile?.id) setCurrentUserId(data.profile.id)
    } catch (error) {
      console.error("Current user error:", error)
    }
  }

  async function loadConversations(openUserId?: string | null) {
    try {
      setLoading(true)
      setError("")

      if (openUserId) {
        const createResponse = await fetch("/api/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: openUserId }),
        })
        const createData = await createResponse.json()
        if (!createResponse.ok) {
          throw new Error(createData.error || "Unable to start conversation")
        }
      }

      const response = await fetch("/api/chat/conversations", { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to load conversations")
      }

      const loaded = data.conversations ?? []
      setConversations(loaded)

      if (openUserId) {
        const conversation = loaded.find(
          (item: Conversation) => item.otherUserId === openUserId
        )
        if (conversation) setSelectedConversation(conversation)
      } else if (loaded.length > 0) {
        setSelectedConversation((current) => current ?? loaded[0])
      }
    } catch (error) {
      console.error("Conversation loading error:", error)
      setError(error instanceof Error ? error.message : "Failed to load conversations")
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages(conversationId: string, showLoading = true) {
    try {
      if (showLoading) setMessagesLoading(true)

      const response = await fetch(`/api/chat/${conversationId}/messages`, {
        cache: "no-store",
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load messages")
      }

      setMessages(data.messages ?? [])
      window.dispatchEvent(new Event("messages-read"))
    } catch (error) {
      console.error("Messages loading error:", error)
      setError(error instanceof Error ? error.message : "Failed to load messages")
    } finally {
      setMessagesLoading(false)
    }
  }

  useEffect(() => {
    loadCurrentUser()
    loadConversations(initialUserId)
  }, [initialUserId])

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([])
      return
    }

    shouldScrollToBottom.current = true
    loadMessages(selectedConversation.id)

    const interval = window.setInterval(() => {
      loadMessages(selectedConversation.id, false)
    }, 2500)

    return () => window.clearInterval(interval)
  }, [selectedConversation?.id])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || !shouldScrollToBottom.current) return
    container.scrollTop = container.scrollHeight
  }, [messages])

  function handleMessagesScroll() {
    const container = messagesContainerRef.current
    if (!container) return

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight

    shouldScrollToBottom.current = distanceFromBottom < 120
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.")
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be 8 MB or smaller.")
      return
    }

    setError("")
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeSelectedImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setSelectedImage(null)
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault()

    if (!selectedConversation || sending || (!message.trim() && !selectedImage)) {
      return
    }

    try {
      setSending(true)
      setError("")

      let body: BodyInit
      const headers: HeadersInit = {}

      if (selectedImage) {
        const formData = new FormData()
        formData.append("body", message.trim())
        formData.append("image", selectedImage)
        body = formData
      } else {
        headers["Content-Type"] = "application/json"
        body = JSON.stringify({ body: message.trim() })
      }

      const response = await fetch(
        `/api/chat/${selectedConversation.id}/messages`,
        { method: "POST", headers, body }
      )

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      shouldScrollToBottom.current = true
      setMessages((current) => [...current, data.message])
      setMessage("")
      removeSelectedImage()
    } catch (error) {
      console.error("Send message error:", error)
      setError(error instanceof Error ? error.message : "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  async function deleteMessage(messageId: string) {
    if (!selectedConversation || deletingMessageId) return
    if (!window.confirm("Delete this message?")) return

    try {
      setDeletingMessageId(messageId)
      setError("")

      const response = await fetch(
        `/api/chat/${selectedConversation.id}/messages`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId }),
        }
      )

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to delete message")

      setMessages((current) => current.filter((item) => item.id !== messageId))
    } catch (error) {
      console.error("Delete message error:", error)
      setError(error instanceof Error ? error.message : "Failed to delete message")
    } finally {
      setDeletingMessageId(null)
    }
  }

  async function clearChat() {
    if (!selectedConversation || clearingChat) return

    const name = selectedConversation.otherUser?.full_name || "this person"
if (
  !window.confirm(
    `Clear the entire chat with ${name}? This will only clear it from your side.`
  )
) {      return
    }

    try {
      setClearingChat(true)
      setError("")

      const response = await fetch(
        `/api/chat/${selectedConversation.id}/messages`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clearChat: true }),
        }
      )

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to clear chat")

      setMessages([])
    } catch (error) {
      console.error("Clear chat error:", error)
      setError(error instanceof Error ? error.message : "Failed to clear chat")
    } finally {
      setClearingChat(false)
    }
  }

  function selectConversation(conversation: Conversation) {
    setSelectedConversation(conversation)
    setError("")
  }

  const selectedUser = selectedConversation?.otherUser

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] min-h-0 max-w-6xl flex-col overflow-hidden p-4 sm:p-6">
      <div className="mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <MessageCircle className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
            <p className="text-sm text-muted-foreground">
              Conversations with your FolioLabs connections.
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[280px_1fr]">
        <aside className="hidden min-h-0 border-r border-border md:flex md:flex-col">
          <div className="border-b border-border p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Conversations
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-5 text-sm text-muted-foreground">Loading...</p>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="mx-auto size-7 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No conversations</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Visit someone's profile and start a conversation.
                </p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const user = conversation.otherUser
                return (
                  <button
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={`flex w-full items-center gap-3 border-b border-border p-4 text-left transition hover:bg-secondary/50 ${
                      selectedConversation?.id === conversation.id ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {(user?.full_name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {user?.full_name || "Unnamed User"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user?.role || "Member"}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          {!selectedConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                <MessageCircle className="size-6 text-primary" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">Start a conversation</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Visit a community profile and click Message to start chatting.
              </p>
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b border-border p-4">
                <button
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="size-5" />
                </button>

                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {(selectedUser?.full_name || "U").charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {selectedUser?.full_name || "Unnamed User"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedUser?.role || "FolioLabs member"}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  disabled={clearingChat || messages.length === 0}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  title="Clear chat"
                >
                  <Trash2 className="size-4" />
                  <span className="hidden sm:inline">Clear chat</span>
                </Button>
              </div>

              {error && (
                <div className="shrink-0 border-b border-destructive/20 bg-destructive/5 px-4 py-3">
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}

              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
              >
                {messagesLoading ? (
                  <p className="text-center text-sm text-muted-foreground">
                    Loading messages...
                  </p>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
                      <MessageCircle className="size-5 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm font-medium">No messages yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Start the conversation.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {messages.map((item) => {
                      const own = item.sender_id === currentUserId
                      const canDelete = own

                      return (
                        <div
                          key={item.id}
                          className={`group flex ${own ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`relative max-w-[80%] rounded-2xl px-4 py-2.5 ${
                              own
                                ? "rounded-br-md bg-primary text-primary-foreground"
                                : "rounded-bl-md bg-secondary text-foreground"
                            }`}
                          >
                            {item.image_url && (
                              <a
                                href={item.image_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mb-2 block overflow-hidden rounded-xl"
                              >
                                <img
                                  src={item.image_url}
                                  alt="Shared image"
                                  className="max-h-80 w-auto max-w-full rounded-xl object-contain"
                                  loading="lazy"
                                />
                              </a>
                            )}

                            {item.body && (
                              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                {item.body}
                              </p>
                            )}

                            <div className="mt-1 flex items-center justify-between gap-3">
                              <p
                                className={`text-[10px] ${
                                  own
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {new Date(item.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => deleteMessage(item.id)}
                                  disabled={deletingMessageId === item.id}
                                  className={`opacity-0 transition group-hover:opacity-100 ${
                                    own
                                      ? "text-primary-foreground/70 hover:text-primary-foreground"
                                      : "text-muted-foreground hover:text-destructive"
                                  }`}
                                  title="Delete message"
                                  aria-label="Delete message"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {imagePreview && (
                <div className="shrink-0 border-t border-border px-3 pt-3 sm:px-4">
                  <div className="relative inline-block overflow-hidden rounded-xl border border-border bg-secondary/30">
                    <img
                      src={imagePreview}
                      alt="Selected image preview"
                      className="max-h-28 max-w-48 object-contain"
                    />
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow"
                      aria-label="Remove selected image"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSend}
                className="shrink-0 border-t border-border p-3 sm:p-4"
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={sending}
                    className="h-11 w-11 shrink-0"
                    title="Share image"
                  >
                    <ImagePlus className="size-4" />
                    <span className="sr-only">Share image</span>
                  </Button>

                  <Input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={selectedImage ? "Add a caption..." : "Write a message..."}
                    maxLength={5000}
                    disabled={sending}
                    className="h-11"
                  />

                  <Button
                    type="submit"
                    disabled={sending || (!message.trim() && !selectedImage)}
                    className="h-11"
                  >
                    <Send className="size-4" />
                    <span className="hidden sm:inline">Send</span>
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
