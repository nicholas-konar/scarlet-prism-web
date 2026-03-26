import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { SiteHeader } from "@/components/SiteHeader"
import { useAuth } from "@/context/AuthContext"
import { useConversationStream } from "@/hooks/useConversationStream"
import { ConversationList } from "@/components/ConversationList"
import { SermonList } from "@/components/SermonList"
import { ConversationWindow } from "@/components/ConversationWindow"
import { ContextPanel } from "@/components/ContextPanel"
import * as conversationApi from "@/api/conversations"
import * as sermonsApi from "@/api/sermons"
import * as scriptureApi from "@/api/scripture"
import type {
    Conversation,
    Message,
    Sermon,
    ConversationSermon,
    ConversationEvent,
    ConversationScripture,
    ScriptureCitation,
} from "@/types/api"

const DEFAULT_MODEL_ID = "gpt-4.1-nano"

function formatSermonMeta(sermon: Sermon | undefined): string | null {
    if (!sermon) return null

    const parts = [sermon.speaker, sermon.recordedOn].filter(Boolean)

    if (parts.length === 0) return null

    return parts.join(" · ")
}

export function ConversationsPage() {
    const { user, currentCongregation } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const selectedConversationId = searchParams.get("id")

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [sermons, setSermons] = useState<Sermon[]>([])
    const [allConversationSermons, setAllConversationSermons] = useState<ConversationSermon[]>([])
    const [allConversationScriptures, setAllConversationScriptures] = useState<
        ConversationScripture[]
    >([])
    const [pendingSermonIds, setPendingSermonIds] = useState<string[]>([])
    const [pendingEvents, setPendingEvents] = useState<ConversationEvent[]>([])
    const [isLoadingConversations, setIsLoadingConversations] = useState(true)
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)
    const [selectedModel, setSelectedModel] = useState(
        user?.defaultModelId || DEFAULT_MODEL_ID,
    )
    const [lastUserMessageId, setLastUserMessageId] = useState<string | null>(null)

    const {
        streamingText,
        isStreaming,
        conversationId: newConversationId,
        sendMessage,
        reset: resetStream,
        error: streamError,
    } = useConversationStream()

    // The effective conversation ID — either from URL or newly created via streaming
    const effectiveConversationId = selectedConversationId || newConversationId || null

    const fetchMessages = useCallback(async (conversationId: string) => {
        const response = await conversationApi.getConversationMessages(conversationId)
        setMessages([...response.data].reverse())
        resetStream()
    }, [resetStream])

    const fetchConversationSermons = useCallback(async (conversationId: string) => {
        try {
            const records = await sermonsApi.getConversationSermons(conversationId)
            setAllConversationSermons(records)
        } catch {
            setAllConversationSermons([])
        }
    }, [])

    const fetchConversationScriptures = useCallback(
        async (conversationId: string) => {
            try {
                const records =
                    await scriptureApi.getConversationScriptures(
                        conversationId,
                    )
                setAllConversationScriptures(records)
            } catch {
                setAllConversationScriptures([])
            }
        },
        [],
    )

    // Load conversations on mount
    useEffect(() => {
        const load = async () => {
            try {
                setIsLoadingConversations(true)
                setApiError(null)
                const response = await conversationApi.listConversations()
                setConversations(response.data)
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                setApiError(message)
            } finally {
                setIsLoadingConversations(false)
            }
        }
        load()
    }, [])

    useEffect(() => {
        if (!currentCongregation) {
            setSermons([])
            return
        }
        sermonsApi
            .listSermons(currentCongregation.id)
            .then((res) => setSermons(res.data))
            .catch(() => setSermons([]))
    }, [currentCongregation])

    // Load messages + resources when selected conversation changes
    useEffect(() => {
        if (!selectedConversationId) {
            if (!isStreaming && !streamError) {
                setMessages([])
                setAllConversationSermons([])
            }
            return
        }

        if (isStreaming || streamError) return

        const load = async () => {
            try {
                setIsLoadingMessages(true)
                await fetchMessages(selectedConversationId)
                await Promise.all([
                    fetchConversationSermons(selectedConversationId),
                    fetchConversationScriptures(selectedConversationId),
                ])
            } catch (err) {
                console.error("Failed to load conversation:", err)
            } finally {
                setIsLoadingMessages(false)
            }
        }

        load()
    }, [
        selectedConversationId,
        isStreaming,
        streamError,
        fetchMessages,
        fetchConversationSermons,
        fetchConversationScriptures,
    ])

    // Reload messages after streaming completes
    useEffect(() => {
        if (!isStreaming && streamingText && newConversationId) {
            const timer = setTimeout(() => {
                fetchMessages(newConversationId).catch(console.error)
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [isStreaming, streamingText, newConversationId, fetchMessages])

    // Sync new conversation to URL
    useEffect(() => {
        if (newConversationId && newConversationId !== selectedConversationId) {
            setSearchParams({ id: newConversationId })
            if (!conversations.find((c) => c.id === newConversationId)) {
                const newConv: Conversation = {
                    id: newConversationId,
                    userId: user!.id,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
                setConversations([newConv, ...conversations])
            }
        }
    }, [newConversationId, selectedConversationId, conversations, user])

    // Once a new conversation is confirmed server-side, fetch full sermon history
    // so the sidebar and event log reflect the sermons that were just attached
    useEffect(() => {
        if (newConversationId) {
            fetchConversationSermons(newConversationId)
            fetchConversationScriptures(newConversationId)
            setPendingSermonIds([])
            setPendingEvents([])
        }
    }, [
        newConversationId,
        fetchConversationSermons,
        fetchConversationScriptures,
    ])

    const handleSelectConversation = (id: string) => {
        resetStream()
        setPendingSermonIds([])
        setPendingEvents([])
        setAllConversationSermons([])
        setAllConversationScriptures([])
        setSearchParams({ id })
    }

    const handleNewConversation = () => {
        resetStream()
        setMessages([])
        setAllConversationSermons([])
        setAllConversationScriptures([])
        setPendingSermonIds([])
        setPendingEvents([])
        setSearchParams({})
    }

    const handleTogglePendingSermon = (sermonId: string) => {
        const sermon = sermons.find((s) => s.id === sermonId)
        const title = sermon?.title ?? sermonId
        const isRemoving = pendingSermonIds.includes(sermonId)
        const pendingEvent: ConversationEvent = {
            id: `pending-${sermonId}-${Date.now()}`,
            text: isRemoving
                ? `Removed "${title}" from new conversation`
                : `Added "${title}" to new conversation`,
            createdAt: new Date().toISOString(),
        }
        setPendingEvents((prev) => [...prev, pendingEvent])
        setPendingSermonIds((prev) =>
            isRemoving ? prev.filter((id) => id !== sermonId) : [...prev, sermonId],
        )
    }

    const handleSendMessage = async (
        message: string,
        isRetry?: boolean,
        retryMessageId?: string,
    ) => {
        try {
            resetStream()
            setLastUserMessageId(null)

            const tempMessageId =
                isRetry && retryMessageId ? retryMessageId : `temp-${Date.now()}`

            if (!isRetry) {
                const conversationId = newConversationId || selectedConversationId
                const userMessage: Message = {
                    id: tempMessageId,
                    conversationId: conversationId || tempMessageId,
                    role: "user",
                    text: message,
                    modelId: selectedModel,
                    createdAt: new Date().toISOString(),
                }
                setMessages((prev) => [...prev, userMessage])
            }

            const onUserMessageSucceeded = (realMessage: Message) => {
                setMessages((prev) =>
                    prev.map((msg) => (msg.id === tempMessageId ? realMessage : msg)),
                )
                setLastUserMessageId(realMessage.id)
            }

            const isNewConversation = !selectedConversationId && !newConversationId
            await sendMessage(
                message,
                selectedModel,
                selectedConversationId || undefined,
                onUserMessageSucceeded,
                isRetry,
                retryMessageId,
                isNewConversation && pendingSermonIds.length > 0 ? pendingSermonIds : undefined,
                undefined,
            )
        } catch (err) {
            console.error("Failed to send message:", err)
        }
    }

    const handleRetry = async () => {
        const userMessage = messages.find((msg) => msg.id === lastUserMessageId)
        if (userMessage && streamError) {
            await handleSendMessage(userMessage.text, true, userMessage.id)
        }
    }

    const handleAttachSermon = async (sermon: Sermon) => {
        if (!effectiveConversationId) return
        try {
            const record = await sermonsApi.attachSermon(effectiveConversationId, sermon.id)
            setAllConversationSermons((prev) => [...prev, { ...record, sermon }])
        } catch (err) {
            console.error("Failed to attach sermon:", err)
        }
    }

    const handleDetachSermon = async (conversationSermonId: string) => {
        if (!effectiveConversationId) return
        try {
            await sermonsApi.detachSermon(effectiveConversationId, conversationSermonId)
            const removedAt = new Date().toISOString()
            setAllConversationSermons((prev) =>
                prev.map((r) => (r.id === conversationSermonId ? { ...r, removedAt } : r)),
            )
        } catch (err) {
            console.error("Failed to detach sermon:", err)
        }
    }

    const activeSermons = allConversationSermons.filter((r) => !r.removedAt)
    const activeScriptures = allConversationScriptures.filter(
        (item) => !item.removedAt,
    )

    const scriptureContextItems = (() => {
        const items = new Map<
            string,
            {
                label: string
                sources: Set<string>
                status: "active" | "pending"
            }
        >()

        const addCitation = (
            citation: Pick<
                ScriptureCitation,
                | "translationId"
                | "bookId"
                | "startChapter"
                | "startVerse"
                | "endVerse"
                | "label"
            >,
            source: string,
            status: "active" | "pending",
        ) => {
            const key = [
                citation.translationId,
                citation.bookId,
                citation.startChapter,
                citation.startVerse ?? "*",
                citation.endVerse ?? "*",
            ].join(":")

            const existing = items.get(key)
            if (existing) {
                existing.sources.add(source)
                if (status === "active") {
                    existing.status = "active"
                }
                return
            }

            items.set(key, {
                label: citation.label,
                sources: new Set([source]),
                status,
            })
        }

        if (effectiveConversationId) {
            activeScriptures.forEach((item) => {
                if (item.citation) {
                    addCitation(item.citation, "directly attached", "active")
                }
            })
            activeSermons.forEach((item) => {
                item.sermon?.scriptures.forEach((citation) =>
                    addCitation(
                        citation,
                        item.sermon?.title
                            ? `from sermon: ${item.sermon.title}`
                            : "from attached sermon",
                        "active",
                    ),
                )
            })
        } else {
            pendingSermonIds.forEach((sermonId) => {
                const sermon = sermons.find((item) => item.id === sermonId)
                sermon?.scriptures.forEach((citation) =>
                    addCitation(citation, `from sermon: ${sermon.title}`, "pending"),
                )
            })
        }

        return Array.from(items.entries()).map(([key, value]) => ({
            key,
            label: value.label,
            source: Array.from(value.sources).join(" + "),
            status: value.status,
        }))
    })()

    const contextSermonItems = effectiveConversationId
        ? activeSermons.map((item) => {
              const sermon =
                  item.sermon ??
                  sermons.find((candidate) => candidate.id === item.sermonId)

              return {
                  key: item.id,
                  label: sermon?.title ?? item.sermonId,
                  meta: formatSermonMeta(sermon),
                  status: "active" as const,
              }
          })
        : pendingSermonIds.map((sermonId) => {
              const sermon = sermons.find((item) => item.id === sermonId)

              return {
                  key: sermonId,
                  label: sermon?.title ?? sermonId,
                  meta: formatSermonMeta(sermon),
                  status: "pending" as const,
              }
          })

    const conversationEvents: ConversationEvent[] = effectiveConversationId
        ? [
              ...allConversationSermons.flatMap((r) => {
                  const title =
                      r.sermon?.title ??
                      sermons.find((s) => s.id === r.sermonId)?.title ??
                      r.sermonId
                  const events: ConversationEvent[] = [
                      {
                          id: `attach-${r.id}`,
                          text: `Attached "${title}" to conversation`,
                          createdAt: r.createdAt,
                      },
                  ]
                  if (r.removedAt) {
                      events.push({
                          id: `detach-${r.id}`,
                          text: `Removed "${title}" from conversation`,
                          createdAt: r.removedAt,
                      })
                  }
                  return events
              }),
              ...allConversationScriptures.flatMap((item) => {
                  const label = item.citation?.label ?? item.scriptureCitationId
                  const events: ConversationEvent[] = [
                      {
                          id: `scripture-attach-${item.id}`,
                          text: `Attached scripture "${label}" to conversation`,
                          createdAt: item.createdAt,
                      },
                  ]
                  if (item.removedAt) {
                      events.push({
                          id: `scripture-detach-${item.id}`,
                          text: `Removed scripture "${label}" from conversation`,
                          createdAt: item.removedAt,
                      })
                  }
                  return events
              }),
          ]
        : pendingEvents

    return (
        <div className="conversations-page">
            <SiteHeader
                title="Conversations"
                links={[
                    { label: "Home", to: "/" },
                    ...(currentCongregation
                        ? [{ label: "Admin", to: "/admin/congregation" }]
                        : []),
                ]}
            />

            <div className="main-layout">
                <div className="sidebar">
                    <SermonList
                        sermons={sermons}
                        activeSermons={activeSermons}
                        pendingSermonIds={pendingSermonIds}
                        conversationId={effectiveConversationId}
                        onAttach={handleAttachSermon}
                        onDetach={handleDetachSermon}
                        onTogglePending={handleTogglePendingSermon}
                        isDisabled={isStreaming}
                    />
                    <ConversationList
                        conversations={conversations}
                        selectedId={selectedConversationId}
                        onSelect={handleSelectConversation}
                        onNewConversation={handleNewConversation}
                        isLoading={isLoadingConversations}
                    />
                </div>

                <div className="conversation-stage">
                    {apiError && (
                        <div className="api-error-banner">API Error: {apiError}</div>
                    )}

                    <ContextPanel
                        sermons={contextSermonItems}
                        scriptures={scriptureContextItems}
                        isPending={!effectiveConversationId}
                    />

                    <ConversationWindow
                        conversationId={effectiveConversationId}
                        messages={messages}
                        events={conversationEvents}
                        streamingText={streamingText}
                        isStreaming={isStreaming}
                        onSendMessage={handleSendMessage}
                        isLoading={isLoadingMessages}
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                        streamError={streamError}
                        lastUserMessageId={lastUserMessageId}
                        onRetry={handleRetry}
                    />
                </div>
            </div>
        </div>
    )
}
