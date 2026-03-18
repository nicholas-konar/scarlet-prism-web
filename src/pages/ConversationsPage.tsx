import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useConversationStream } from "@/hooks/useConversationStream"
import { ConversationList } from "@/components/ConversationList"
import { SermonList } from "@/components/SermonList"
import { ConversationWindow } from "@/components/ConversationWindow"
import * as conversationApi from "@/api/conversations"
import * as sermonsApi from "@/api/sermons"
import type { Conversation, Message, Sermon, ConversationSermon, ConversationEvent } from "@/types/api"

const DEFAULT_MODEL_ID = "gpt-4.1-nano"

export function ConversationsPage() {
    const { user, logout, currentCongregation } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const selectedConversationId = searchParams.get("id")

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [sermons, setSermons] = useState<Sermon[]>([])
    const [allConversationSermons, setAllConversationSermons] = useState<ConversationSermon[]>([])
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

    // Load sermons when congregation is available
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
                await fetchConversationSermons(selectedConversationId)
            } catch (err) {
                console.error("Failed to load conversation:", err)
            } finally {
                setIsLoadingMessages(false)
            }
        }

        load()
    }, [selectedConversationId, isStreaming, streamError, fetchMessages, fetchConversationSermons])

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
            setPendingSermonIds([])
            setPendingEvents([])
        }
    }, [newConversationId, fetchConversationSermons])

    const handleSelectConversation = (id: string) => {
        resetStream()
        setPendingSermonIds([])
        setPendingEvents([])
        setAllConversationSermons([])
        setSearchParams({ id })
    }

    const handleNewConversation = () => {
        resetStream()
        setMessages([])
        setAllConversationSermons([])
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

    const conversationEvents: ConversationEvent[] = effectiveConversationId
        ? allConversationSermons.flatMap((r) => {
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
          })
        : pendingEvents

    return (
        <div className="conversations-page">
            <div className="header">
                <div className="header-left">
                    <h1>Scarlet Prism</h1>
                    {currentCongregation && (
                        <span className="congregation-name">
                            {currentCongregation.name}
                        </span>
                    )}
                </div>
                <div className="header-right">
                    <span className="user-email">{user?.email}</span>
                    <button className="logout-btn" onClick={logout}>
                        [logout]
                    </button>
                </div>
            </div>

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

                {apiError && (
                    <div className="api-error-banner">API Error: {apiError}</div>
                )}

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
    )
}

