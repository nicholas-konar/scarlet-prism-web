import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { SiteHeader } from "@/components/SiteHeader"
import { useAuth } from "@/context/AuthContext"
import { useConversationStream } from "@/hooks/useConversationStream"
import { ConversationList } from "@/components/ConversationList"
import { SermonList } from "@/components/SermonList"
import { ScripturePanel } from "@/components/ScripturePanel"
import { ConversationWindow } from "@/components/ConversationWindow"
import * as conversationApi from "@/api/conversations"
import * as sermonsApi from "@/api/sermons"
import * as scriptureApi from "@/api/scripture"
import * as userApi from "@/api/user"
import type {
    BibleTranslation,
    Conversation,
    Message,
    Sermon,
    ConversationSermon,
    ConversationEvent,
    ConversationScripture,
    ScriptureCitation,
} from "@/types/api"
import type { PendingScriptureCitation } from "@/components/ScriptureCitationPicker"

const DEFAULT_MODEL_ID = "gpt-4.1-nano"

export function ConversationsPage() {
    const { user, currentCongregation, refreshUser } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const selectedConversationId = searchParams.get("id")

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [sermons, setSermons] = useState<Sermon[]>([])
    const [translations, setTranslations] = useState<BibleTranslation[]>([])
    const [allConversationSermons, setAllConversationSermons] = useState<ConversationSermon[]>([])
    const [allConversationScriptures, setAllConversationScriptures] = useState<
        ConversationScripture[]
    >([])
    const [pendingSermonIds, setPendingSermonIds] = useState<string[]>([])
    const [pendingScriptures, setPendingScriptures] = useState<
        PendingScriptureCitation[]
    >([])
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

    // Load sermons when congregation is available
    useEffect(() => {
        scriptureApi
            .listBibleTranslations()
            .then(setTranslations)
            .catch(() => setTranslations([]))
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
            setPendingScriptures([])
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
        setPendingScriptures([])
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
        setPendingScriptures([])
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
                isNewConversation && pendingScriptures.length > 0
                    ? pendingScriptures.map(({ label: _label, ...citation }) => citation)
                    : undefined,
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

    const handleAddScripture = async (
        citation: PendingScriptureCitation,
    ) => {
        if (effectiveConversationId) {
            try {
                const record = await scriptureApi.attachScripture(
                    effectiveConversationId,
                    {
                        translationId: citation.translationId,
                        bookId: citation.bookId,
                        startChapter: citation.startChapter,
                        startVerse: citation.startVerse,
                        endVerse: citation.endVerse,
                    },
                )
                setAllConversationScriptures((prev) => [
                    ...prev,
                    { ...record, citation: record.citation },
                ])
            } catch (err) {
                console.error("Failed to attach scripture:", err)
            }
            return
        }

        setPendingScriptures((prev) => [...prev, citation])
        setPendingEvents((prev) => [
            ...prev,
            {
                id: `pending-scripture-${Date.now()}`,
                text: `Added scripture "${citation.label}" to new conversation`,
                createdAt: new Date().toISOString(),
            },
        ])
    }

    const handleDetachScripture = async (
        conversationScriptureId: string,
    ) => {
        if (!effectiveConversationId) return

        try {
            await scriptureApi.detachScripture(
                effectiveConversationId,
                conversationScriptureId,
            )
            const removedAt = new Date().toISOString()
            setAllConversationScriptures((prev) =>
                prev.map((item) =>
                    item.id === conversationScriptureId
                        ? { ...item, removedAt }
                        : item,
                ),
            )
        } catch (err) {
            console.error("Failed to detach scripture:", err)
        }
    }

    const handleRemovePendingScripture = (index: number) => {
        const citation = pendingScriptures[index]
        if (!citation) return

        setPendingScriptures((prev) =>
            prev.filter((_, itemIndex) => itemIndex !== index),
        )
        setPendingEvents((prev) => [
            ...prev,
            {
                id: `pending-scripture-remove-${Date.now()}`,
                text: `Removed scripture "${citation.label}" from new conversation`,
                createdAt: new Date().toISOString(),
            },
        ])
    }

    const handleChangeDefaultBibleTranslation = async (
        nextTranslationId: string,
    ) => {
        try {
            await userApi.setDefaultBibleTranslation(
                nextTranslationId || null,
            )
            await refreshUser()
        } catch (err) {
            console.error("Failed to update default bible translation:", err)
        }
    }

    const activeSermons = allConversationSermons.filter((r) => !r.removedAt)
    const activeScriptures = allConversationScriptures.filter(
        (item) => !item.removedAt,
    )

    const scriptureContextItems = (() => {
        const items = new Map<
            string,
            { label: string; translationId: string; sources: Set<string> }
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
                return
            }

            items.set(key, {
                label: citation.label,
                translationId: citation.translationId,
                sources: new Set([source]),
            })
        }

        if (effectiveConversationId) {
            activeScriptures.forEach((item) => {
                if (item.citation) addCitation(item.citation, "Manual")
            })
            activeSermons.forEach((item) => {
                item.sermon?.scriptures.forEach((citation) =>
                    addCitation(citation, item.sermon?.title ?? "Sermon"),
                )
            })
        } else {
            pendingScriptures.forEach((citation) => addCitation(citation, "Manual"))
            pendingSermonIds.forEach((sermonId) => {
                const sermon = sermons.find((item) => item.id === sermonId)
                sermon?.scriptures.forEach((citation) =>
                    addCitation(citation, sermon.title),
                )
            })
        }

        return Array.from(items.entries()).map(([key, value]) => ({
            key,
            label: value.label,
            translationId: value.translationId,
            sources: Array.from(value.sources),
        }))
    })()

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
                    {user && translations.length > 0 && (
                        <fieldset className="panel form-panel">
                            <legend>Defaults</legend>
                            <label className="form-field">
                                <span>Your default Bible translation</span>
                                <select
                                    value={user.defaultBibleTranslationId ?? ""}
                                    onChange={(event) =>
                                        handleChangeDefaultBibleTranslation(
                                            event.target.value,
                                        )
                                    }
                                    disabled={isStreaming}
                                >
                                    <option value="">
                                        Use congregation/system default
                                    </option>
                                    {translations.map((translation) => (
                                        <option
                                            key={translation.id}
                                            value={translation.id}
                                        >
                                            {translation.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <p className="meta-copy">
                                Effective: {user.effectiveBibleTranslationId.toUpperCase()}
                            </p>
                        </fieldset>
                    )}

                    {user && translations.length > 0 && (
                        <ScripturePanel
                            translations={translations}
                            defaultTranslationId={
                                user.effectiveBibleTranslationId
                            }
                            disabled={isStreaming}
                            onAdd={handleAddScripture}
                            manualItems={
                                effectiveConversationId
                                    ? activeScriptures.map((item) => ({
                                          id: item.id,
                                          label:
                                              item.citation?.label ??
                                              item.scriptureCitationId,
                                          translationId:
                                              item.citation?.translationId ??
                                              user.effectiveBibleTranslationId,
                                          removeLabel: "Detach",
                                          onRemove: () =>
                                              handleDetachScripture(item.id),
                                      }))
                                    : pendingScriptures.map(
                                          (citation, index) => ({
                                              id: `${citation.translationId}:${citation.label}:${index}`,
                                              label: citation.label,
                                              translationId:
                                                  citation.translationId,
                                              removeLabel: "Remove",
                                              onRemove: () =>
                                                  handleRemovePendingScripture(
                                                      index,
                                                  ),
                                          }),
                                      )
                            }
                            contextItems={scriptureContextItems}
                        />
                    )}

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
