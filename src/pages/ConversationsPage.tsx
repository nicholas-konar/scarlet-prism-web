import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { SiteHeader } from "@/components/SiteHeader"
import { useAuth } from "@/context/AuthContext"
import { useConversationStream } from "@/hooks/useConversationStream"
import { ConversationList } from "@/components/ConversationList"
import { SermonList } from "@/components/SermonList"
import { ConversationWindow } from "@/components/ConversationWindow"
import { ContextPanel } from "@/components/ContextPanel"
import { ScriptureList } from "@/components/ScriptureList"
import {
    ScriptureCitationPicker,
    type PendingScriptureCitation,
} from "@/components/ScriptureCitationPicker"
import * as conversationApi from "@/api/conversations"
import * as sermonsApi from "@/api/sermons"
import * as scriptureApi from "@/api/scripture"
import { getEffectiveBibleTranslationId } from "@/lib/scripture"
import type {
    BibleTranslation,
    Conversation,
    Message,
    Sermon,
    ConversationSermon,
    ConversationEvent,
    ConversationScripture,
    ScriptureCitation,
    ScriptureCitationInput,
} from "@/types/api"

const DEFAULT_MODEL_ID = "gpt-4.1-nano"
type LibrarySection = "conversations" | "sermons" | "scripture"

function formatSermonDate(value: string | null): string | null {
    if (!value?.trim()) return null

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    const parts = new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    }).formatToParts(date)

    const weekday = parts.find((part) => part.type === "weekday")?.value
    const month = parts.find((part) => part.type === "month")?.value
    const day = parts.find((part) => part.type === "day")?.value
    const year = parts.find((part) => part.type === "year")?.value

    if (!weekday || !month || !day || !year) {
        return value
    }

    return `${weekday} ${month} ${day}, ${year}`
}

function getCitationKey(
    citation: Pick<
        ScriptureCitationInput,
        "translationId" | "bookId" | "startChapter" | "startVerse" | "endVerse"
    >,
): string {
    return [
        citation.translationId ?? "*",
        citation.bookId,
        citation.startChapter,
        citation.startVerse ?? "*",
        citation.endVerse ?? "*",
    ].join(":")
}

export function ConversationsPage() {
    const { user, currentCongregation } = useAuth()
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
    const [pendingUserScriptures, setPendingUserScriptures] = useState<
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
    const [isContextOpen, setIsContextOpen] = useState(true)
    const [isLibraryOpen, setIsLibraryOpen] = useState(false)
    const [isAddingScripture, setIsAddingScripture] = useState(false)
    const [activeLibrarySection, setActiveLibrarySection] =
        useState<LibrarySection>("sermons")

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

    useEffect(() => {
        if (!isLibraryOpen) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsLibraryOpen(false)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isLibraryOpen])

    // Load messages + resources when selected conversation changes
    useEffect(() => {
        if (!selectedConversationId) {
            if (!isStreaming && !streamError) {
                setMessages([])
                setAllConversationSermons([])
                setAllConversationScriptures([])
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
            setPendingUserScriptures([])
            setPendingEvents([])
            setIsAddingScripture(false)
        }
    }, [
        newConversationId,
        fetchConversationSermons,
        fetchConversationScriptures,
    ])

    const handleSelectConversation = (id: string) => {
        resetStream()
        setPendingSermonIds([])
        setPendingUserScriptures([])
        setPendingEvents([])
        setAllConversationSermons([])
        setAllConversationScriptures([])
        setIsAddingScripture(false)
        setSearchParams({ id })
    }

    const handleNewConversation = () => {
        resetStream()
        setMessages([])
        setAllConversationSermons([])
        setAllConversationScriptures([])
        setPendingSermonIds([])
        setPendingUserScriptures([])
        setPendingEvents([])
        setIsAddingScripture(false)
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
                isNewConversation && pendingUserScriptures.length > 0
                    ? pendingUserScriptures.map(
                          ({
                              translationId,
                              bookId,
                              startChapter,
                              startVerse,
                              endVerse,
                          }) => ({
                              translationId,
                              bookId,
                              startChapter,
                              startVerse,
                              endVerse,
                          }),
                      )
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

    const handleAddUserScripture = async (citation: PendingScriptureCitation) => {
        const citationKey = getCitationKey(citation)

        if (effectiveConversationId) {
            const alreadyAttached = activeScriptures.some(
                (item) =>
                    item.citation && getCitationKey(item.citation) === citationKey,
            )
            if (alreadyAttached) {
                setIsAddingScripture(false)
                return
            }

            try {
                await scriptureApi.attachScripture(effectiveConversationId, {
                    translationId: citation.translationId,
                    bookId: citation.bookId,
                    startChapter: citation.startChapter,
                    startVerse: citation.startVerse,
                    endVerse: citation.endVerse,
                })
                await fetchConversationScriptures(effectiveConversationId)
                setIsAddingScripture(false)
            } catch (err) {
                console.error("Failed to attach scripture:", err)
            }

            return
        }

        const alreadyPending = pendingUserScriptures.some(
            (item) => getCitationKey(item) === citationKey,
        )
        if (alreadyPending) {
            setIsAddingScripture(false)
            return
        }

        const pendingEvent: ConversationEvent = {
            id: `pending-scripture-${citationKey}-${Date.now()}`,
            text: `Added scripture "${citation.label}" to new conversation`,
            createdAt: new Date().toISOString(),
        }

        setPendingUserScriptures((prev) => [...prev, citation])
        setPendingEvents((prev) => [...prev, pendingEvent])
        setIsAddingScripture(false)
    }

    const handleDetachUserScripture = async (
        scriptureKey: string,
        conversationScriptureId?: string,
    ) => {
        if (effectiveConversationId && conversationScriptureId) {
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

            return
        }

        const removed = pendingUserScriptures.find(
            (item) => getCitationKey(item) === scriptureKey,
        )
        if (!removed) return

        const pendingEvent: ConversationEvent = {
            id: `pending-scripture-remove-${scriptureKey}-${Date.now()}`,
            text: `Removed scripture "${removed.label}" from new conversation`,
            createdAt: new Date().toISOString(),
        }

        setPendingUserScriptures((prev) =>
            prev.filter((item) => getCitationKey(item) !== scriptureKey),
        )
        setPendingEvents((prev) => [...prev, pendingEvent])
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
                userScriptureIds: string[]
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
            userScriptureId?: string,
        ) => {
            const key = getCitationKey(citation)

            const existing = items.get(key)
            if (existing) {
                existing.sources.add(source)
                if (userScriptureId) {
                    existing.userScriptureIds.push(userScriptureId)
                }
                return
            }

            items.set(key, {
                label: citation.label,
                sources: new Set([source]),
                userScriptureIds: userScriptureId ? [userScriptureId] : [],
            })
        }

        if (effectiveConversationId) {
            activeScriptures.forEach((item) => {
                if (item.citation) {
                    addCitation(item.citation, "from you", item.id)
                }
            })
            activeSermons.forEach((item) => {
                item.sermon?.scriptures.forEach((citation) =>
                    addCitation(
                        citation,
                        item.sermon?.title
                            ? `from sermon: ${item.sermon.title}`
                            : "from attached sermon",
                    ),
                )
            })
        } else {
            pendingUserScriptures.forEach((citation) => {
                addCitation(citation, "from you", getCitationKey(citation))
            })
            pendingSermonIds.forEach((sermonId) => {
                const sermon = sermons.find((item) => item.id === sermonId)
                sermon?.scriptures.forEach((citation) =>
                    addCitation(citation, `from sermon: ${sermon.title}`),
                )
            })
        }

        return Array.from(items.entries()).map(([key, value]) => ({
            key,
            label: value.label,
            source: Array.from(value.sources).join(" + "),
            onDetach:
                value.userScriptureIds.length > 0
                    ? () => {
                          void handleDetachUserScripture(
                              key,
                              effectiveConversationId
                                  ? value.userScriptureIds[0]
                                  : undefined,
                          )
                      }
                    : undefined,
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
                  recordedOn: formatSermonDate(sermon?.recordedOn ?? null),
                  speaker: sermon?.speaker,
                  onDetach: () => {
                      void handleDetachSermon(item.id)
                  },
              }
          })
        : pendingSermonIds.map((sermonId) => {
              const sermon = sermons.find((item) => item.id === sermonId)

              return {
                  key: sermonId,
                  label: sermon?.title ?? sermonId,
                  recordedOn: formatSermonDate(sermon?.recordedOn ?? null),
                  speaker: sermon?.speaker,
                  onDetach: () => handleTogglePendingSermon(sermonId),
              }
          })

    const libraryScriptureItems = scriptureContextItems.map((scripture) => ({
        key: scripture.key,
        label: scripture.label,
        meta: scripture.source,
    }))

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

    const hasContext = contextSermonItems.length > 0 || scriptureContextItems.length > 0
    const defaultTranslationId = getEffectiveBibleTranslationId({
        userDefaultBibleTranslationId: user?.defaultBibleTranslationId,
        congregationDefaultBibleTranslationId:
            currentCongregation?.defaultBibleTranslationId,
    })

    const librarySectionButtons: Array<{
        id: LibrarySection
        label: string
        count: number
    }> = [
        {
            id: "conversations",
            label: "Conversations",
            count: conversations.length,
        },
        {
            id: "sermons",
            label: "Sermons",
            count: sermons.length,
        },
        {
            id: "scripture",
            label: "Scripture",
            count: libraryScriptureItems.length,
        },
    ]

    function openLibrary(section: LibrarySection = activeLibrarySection) {
        setActiveLibrarySection(section)
        setIsLibraryOpen(true)
    }

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

            <div
                className={`main-layout conversation-workspace${
                    isContextOpen ? " context-open" : ""
                }`}
            >
                {isContextOpen ? (
                    <ContextPanel
                        sermons={contextSermonItems}
                        scriptures={scriptureContextItems}
                        isAddingScripture={isAddingScripture}
                        canAddScripture={translations.length > 0 && !isStreaming}
                        scripturePicker={
                            <ScriptureCitationPicker
                                translations={translations}
                                defaultTranslationId={defaultTranslationId}
                                disabled={isStreaming}
                                onAdd={(citation) => {
                                    void handleAddUserScripture(citation)
                                }}
                            />
                        }
                        onToggleScripturePicker={() =>
                            setIsAddingScripture((current) => !current)
                        }
                        onClose={() => setIsContextOpen(false)}
                    />
                ) : null}

                <div className="conversation-stage">
                    <div className="workspace-toolbar panel-shell">
                        <div className="workspace-toolbar-main">
                            <button
                                type="button"
                                className={`drawer-toggle${isContextOpen ? " active" : ""}`}
                                onClick={() => setIsContextOpen((current) => !current)}
                            >
                                {isContextOpen ? "Hide context" : "Show context"}
                            </button>
                            <div className="workspace-context-summary">
                                <span>{contextSermonItems.length} sermon{contextSermonItems.length === 1 ? "" : "s"}</span>
                                <span>{scriptureContextItems.length} scripture{scriptureContextItems.length === 1 ? "" : "s"}</span>
                            </div>
                        </div>
                        <div className="workspace-toolbar-actions">
                            {librarySectionButtons.map((section) => (
                                <button
                                    key={section.id}
                                    type="button"
                                    className={`toolbar-chip${
                                        activeLibrarySection === section.id
                                            ? " active"
                                            : ""
                                    }`}
                                    onClick={() => openLibrary(section.id)}
                                >
                                    {section.label}
                                    <span>{section.count}</span>
                                </button>
                            ))}
                            <button
                                type="button"
                                className="drawer-toggle library-launch"
                                onClick={() => openLibrary()}
                            >
                                Open library
                            </button>
                        </div>
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

            {isLibraryOpen ? (
                <div
                    className="library-overlay"
                    role="presentation"
                    onClick={() => setIsLibraryOpen(false)}
                >
                    <aside
                        className="library-drawer panel-shell"
                        aria-label="Library"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="library-drawer-header">
                            <div>
                                <p className="panel-eyebrow">Workspace library</p>
                                <h2 className="panel-title">Library</h2>
                            </div>
                            <button
                                type="button"
                                className="drawer-toggle drawer-dismiss"
                                onClick={() => setIsLibraryOpen(false)}
                            >
                                Close
                            </button>
                        </div>

                        <div className="library-section-tabs" role="tablist" aria-label="Library sections">
                            {librarySectionButtons.map((section) => (
                                <button
                                    key={section.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeLibrarySection === section.id}
                                    className={`library-section-tab${
                                        activeLibrarySection === section.id
                                            ? " active"
                                            : ""
                                    }`}
                                    onClick={() => setActiveLibrarySection(section.id)}
                                >
                                    <span>{section.label}</span>
                                    <span>{section.count}</span>
                                </button>
                            ))}
                        </div>

                        <div className="library-drawer-body">
                            {activeLibrarySection === "conversations" ? (
                                <ConversationList
                                    conversations={conversations}
                                    selectedId={selectedConversationId}
                                    onSelect={(id) => {
                                        handleSelectConversation(id)
                                        setIsLibraryOpen(false)
                                    }}
                                    onNewConversation={() => {
                                        handleNewConversation()
                                        setIsLibraryOpen(false)
                                    }}
                                    isLoading={isLoadingConversations}
                                />
                            ) : null}

                            {activeLibrarySection === "sermons" ? (
                                <SermonList
                                    sermons={sermons}
                                    activeSermons={activeSermons}
                                    pendingSermonIds={pendingSermonIds}
                                    conversationId={effectiveConversationId}
                                    eyebrow={currentCongregation?.name ?? null}
                                    onAttach={handleAttachSermon}
                                    onDetach={handleDetachSermon}
                                    onTogglePending={handleTogglePendingSermon}
                                    isDisabled={isStreaming}
                                />
                            ) : null}

                            {activeLibrarySection === "scripture" ? (
                                <ScriptureList
                                    scriptures={libraryScriptureItems}
                                    eyebrow={hasContext ? "Current references" : "Library"}
                                />
                            ) : null}
                        </div>
                    </aside>
                </div>
            ) : null}
        </div>
    )
}
