import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useConversationStream } from "@/hooks/useConversationStream"
import { HistoryConversationList } from "@/components/HistoryConversationList"
import { HistorySermonList } from "@/components/HistorySermonList"
import { ConversationWindow } from "@/components/ConversationWindow"
import { LibraryPanel } from "@/components/LibraryPanel"
import { HistoryScriptureList } from "@/components/HistoryScriptureList"
import {
    ScriptureCitationPicker,
    type PendingScriptureCitation,
} from "@/components/ScriptureCitationPicker"
import { getEffectiveBibleTranslationId } from "@/lib/scripture"
import type { Conversation, Message, Sermon } from "@/types/api"
import { conversationWorkspaceApi } from "./conversations/api"
import { ConversationHistoryDrawer } from "./conversations/ConversationHistoryDrawer"
import { ConversationSermonPicker } from "./conversations/ConversationSermonPicker"
import { ConversationToolbar } from "./conversations/ConversationToolbar"
import { DEFAULT_MODEL_ID } from "./conversations/models"
import { useConversationDraftState } from "./conversations/useConversationDraftState"
import { useConversationHistoryDrawer } from "./conversations/useConversationHistoryDrawer"
import { useConversationScriptureHydration } from "./conversations/useConversationScriptureHydration"
import { useConversationWorkspaceData } from "./conversations/useConversationWorkspaceData"
import {
    buildConversationEvents,
    buildHistoryScriptureItems,
    buildHistorySectionButtons,
    buildLibraryScriptureItems,
    buildLibrarySermonItems,
    getCitationKey,
} from "./conversations/utils"

export function ConversationsPage() {
    const { user, currentCongregation } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const selectedConversationId = searchParams.get("id")
    const [selectedModel, setSelectedModel] = useState(
        user?.defaultModelId || DEFAULT_MODEL_ID,
    )
    const [lastUserMessageId, setLastUserMessageId] = useState<string | null>(null)
    const [isLibraryOpen, setIsLibraryOpen] = useState(true)

    const {
        streamingText,
        isStreaming,
        conversationId: newConversationId,
        conversationTitle: streamedConversationTitle,
        initializeConversation,
        sendMessage,
        reset: resetStream,
        error: streamError,
    } = useConversationStream(conversationWorkspaceApi)

    const {
        conversations,
        setConversations,
        messages,
        setMessages,
        sermons,
        translations,
        allConversationSermons,
        setAllConversationSermons,
        allConversationScriptures,
        setAllConversationScriptures,
        isLoadingConversations,
        isLoadingMessages,
        apiError,
        clearConversationResources,
        fetchConversationScriptures,
    } = useConversationWorkspaceData({
        currentCongregationId: currentCongregation?.id ?? null,
        isStreaming,
        newConversationId,
        api: conversationWorkspaceApi,
        resetStream,
        selectedConversationId,
        streamError,
        streamingText,
    })

    const {
        pendingSermonIds,
        pendingUserScriptures,
        pendingEvents,
        isAddingSermon,
        isAddingScripture,
        resetDraftState,
        closePickers,
        toggleSermonPicker,
        toggleScripturePicker,
        togglePendingSermon,
        addPendingUserScripture,
        removePendingUserScripture,
    } = useConversationDraftState({ sermons })

    const {
        isHistoryOpen,
        activeHistorySection,
        setActiveHistorySection,
        openHistory,
        closeHistory,
    } = useConversationHistoryDrawer()

    const effectiveConversationId = selectedConversationId || newConversationId || null
    const selectedConversation =
        conversations.find((conversation) => conversation.id === selectedConversationId) ??
        null
    const conversationTitle =
        selectedConversation?.conversationTitle?.trim() ||
        (!selectedConversationId ? streamedConversationTitle?.trim() : null) ||
        "New Conversation"
    const activeSermons = allConversationSermons.filter((record) => !record.removedAt)
    const activeScriptures = allConversationScriptures.filter(
        (item) => !item.removedAt,
    )

    useEffect(() => {
        if (selectedConversationId || newConversationId || !user?.id) {
            return
        }

        void initializeConversation().catch((error) => {
            console.error("Failed to initialize conversation:", error)
        })
    }, [initializeConversation, newConversationId, selectedConversationId, user?.id])

    useEffect(() => {
        if (!effectiveConversationId || !streamedConversationTitle?.trim()) return

        setConversations((current) =>
            current.map((conversation) =>
                conversation.id === effectiveConversationId
                    ? {
                          ...conversation,
                          conversationTitle: streamedConversationTitle,
                      }
                    : conversation,
            ),
        )
    }, [effectiveConversationId, setConversations, streamedConversationTitle])

    function handleSelectConversation(id: string) {
        resetStream()
        clearConversationResources()
        resetDraftState()
        setSearchParams({ id })
    }

    function handleNewConversation() {
        resetStream()
        clearConversationResources()
        resetDraftState()
        setSearchParams({})
        void initializeConversation().catch((error) => {
            console.error("Failed to initialize conversation:", error)
        })
    }

    async function attachSermonToConversation(
        conversationId: string,
        sermon: Sermon,
    ) {
        const record = await conversationWorkspaceApi.attachSermon(
            conversationId,
            sermon.id,
        )

        setAllConversationSermons((current) => [...current, { ...record, sermon }])
    }

    async function attachScriptureToConversation(
        conversationId: string,
        citation: PendingScriptureCitation,
    ) {
        const record = await conversationWorkspaceApi.attachScripture(
            conversationId,
            {
                translationId: citation.translationId,
                bookId: citation.bookId,
                startChapter: citation.startChapter,
                startVerse: citation.startVerse,
                endVerse: citation.endVerse,
            },
        )

        setAllConversationScriptures((current) => [...current, record])
    }

    async function handleSendMessage(
        message: string,
        isRetry?: boolean,
        retryMessageId?: string,
    ) {
        try {
            setLastUserMessageId(null)
            let conversationId = selectedConversationId || newConversationId || null

            if (!conversationId && !isRetry) {
                conversationId = await initializeConversation()
            }

            const tempMessageId =
                isRetry && retryMessageId ? retryMessageId : `temp-${Date.now()}`

            if (!isRetry) {
                const userMessage: Message = {
                    id: tempMessageId,
                    conversationId: conversationId || tempMessageId,
                    role: "user",
                    text: message,
                    modelId: selectedModel,
                    createdAt: new Date().toISOString(),
                }

                setMessages((current) => [...current, userMessage])
            }

            const onUserMessageSucceeded = (realMessage: Message) => {
                setMessages((current) =>
                    current.map((item) =>
                        item.id === tempMessageId ? realMessage : item,
                    ),
                )
                setLastUserMessageId(realMessage.id)

                if (!selectedConversationId && user?.id) {
                    setSearchParams({ id: realMessage.conversationId })
                    setConversations((current) => {
                        if (
                            current.some(
                                (conversation) =>
                                    conversation.id === realMessage.conversationId,
                            )
                        ) {
                            return current
                        }

                        const timestamp = realMessage.createdAt || new Date().toISOString()
                        const newConversation: Conversation = {
                            id: realMessage.conversationId,
                            userId: user.id,
                            conversationTitle: streamedConversationTitle ?? null,
                            createdAt: timestamp,
                            updatedAt: timestamp,
                        }

                        return [newConversation, ...current]
                    })
                }
            }

            if (!conversationId) {
                throw new Error(
                    isRetry
                        ? "Retry requires an existing conversation"
                        : "Conversation initialization failed",
                )
            }

            const confirmedConversationId = conversationId

            if (!isRetry) {
                for (const citation of pendingUserScriptures) {
                    await attachScriptureToConversation(confirmedConversationId, citation)
                }

                for (const sermonId of pendingSermonIds) {
                    const sermon = sermons.find((item) => item.id === sermonId)
                    if (!sermon) continue
                    await attachSermonToConversation(confirmedConversationId, sermon)
                }

                if (pendingUserScriptures.length > 0 || pendingSermonIds.length > 0) {
                    resetDraftState()
                }
            }

            await sendMessage(
                message,
                selectedModel,
                confirmedConversationId,
                onUserMessageSucceeded,
                isRetry,
                retryMessageId,
            )
        } catch (err) {
            console.error("Failed to send message:", err)
        }
    }

    async function handleRetry() {
        const userMessage = messages.find((message) => message.id === lastUserMessageId)
        if (userMessage && streamError) {
            await handleSendMessage(userMessage.text, true, userMessage.id)
        }
    }

    async function handleAttachSermon(sermon: Sermon) {
        if (!effectiveConversationId) return

        try {
            await attachSermonToConversation(effectiveConversationId, sermon)
        } catch (err) {
            console.error("Failed to attach sermon:", err)
        }
    }

    async function handleAddSermonToContext(sermon: Sermon) {
        const conversationId =
            effectiveConversationId || (await initializeConversation().catch(() => null))

        if (conversationId) {
            const alreadyAttached = activeSermons.some(
                (item) => item.sermonId === sermon.id,
            )
            if (alreadyAttached) {
                closePickers()
                return
            }

            await attachSermonToConversation(conversationId, sermon)
            closePickers()
            return
        }

        if (pendingSermonIds.includes(sermon.id)) {
            closePickers()
            return
        }

        togglePendingSermon(sermon.id)
        closePickers()
    }

    async function handleDetachSermon(conversationSermonId: string) {
        if (!effectiveConversationId) return

        try {
            await conversationWorkspaceApi.detachSermon(
                effectiveConversationId,
                conversationSermonId,
            )
            const removedAt = new Date().toISOString()
            setAllConversationSermons((current) =>
                current.map((record) =>
                    record.id === conversationSermonId
                        ? { ...record, removedAt }
                        : record,
                ),
            )
        } catch (err) {
            console.error("Failed to detach sermon:", err)
        }
    }

    async function handleAddUserScripture(citation: PendingScriptureCitation) {
        const citationKey = getCitationKey(citation)
        const conversationId =
            effectiveConversationId || (await initializeConversation().catch(() => null))

        if (conversationId) {
            const alreadyAttached = activeScriptures.some(
                (item) =>
                    item.citation && getCitationKey(item.citation) === citationKey,
            )
            if (alreadyAttached) {
                closePickers()
                return
            }

            try {
                await attachScriptureToConversation(conversationId, citation)
                closePickers()
            } catch (err) {
                console.error("Failed to attach scripture:", err)
            }

            return
        }

        const wasAdded = addPendingUserScripture(citation)
        if (wasAdded) {
            closePickers()
        }
    }

    async function handleDetachUserScripture(
        scriptureKey: string,
        conversationScriptureId?: string,
    ) {
        if (effectiveConversationId && conversationScriptureId) {
            try {
                await conversationWorkspaceApi.detachScripture(
                    effectiveConversationId,
                    conversationScriptureId,
                )
                const removedAt = new Date().toISOString()
                setAllConversationScriptures((current) =>
                    current.map((item) =>
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

        removePendingUserScripture(scriptureKey)
    }

    const libraryScriptureItems = buildLibraryScriptureItems({
        effectiveConversationId,
        activeScriptures,
        pendingUserScriptures,
        pendingSermonIds,
        sermons,
        translations,
        onDetachUserScripture: handleDetachUserScripture,
    })

    const librarySermonItems = buildLibrarySermonItems({
        effectiveConversationId,
        activeSermons,
        pendingSermonIds,
        sermons,
        onDetachSermon: handleDetachSermon,
        onTogglePendingSermon: togglePendingSermon,
    })

    const historyScriptureItems = buildHistoryScriptureItems(libraryScriptureItems)
    const availableSermons = sermons.filter((sermon) =>
        effectiveConversationId
            ? !activeSermons.some((item) => item.sermonId === sermon.id)
            : !pendingSermonIds.includes(sermon.id),
    )
    const conversationEvents = buildConversationEvents({
        effectiveConversationId,
        allConversationSermons,
        allConversationScriptures,
        sermons,
        pendingEvents,
    })
    const hasLibraryContent =
        librarySermonItems.length > 0 || libraryScriptureItems.length > 0
    const defaultTranslationId = getEffectiveBibleTranslationId({
        userDefaultBibleTranslationId: user?.defaultBibleTranslationId,
        congregationDefaultBibleTranslationId:
            currentCongregation?.defaultBibleTranslationId,
    })
    const historySectionButtons = buildHistorySectionButtons({
        conversationsCount: conversations.length,
        sermonsCount: sermons.length,
        scriptureCount: historyScriptureItems.length,
    })

    useConversationScriptureHydration({
        conversationId: effectiveConversationId,
        scriptures: activeScriptures,
        refreshScriptures: fetchConversationScriptures,
    })

    return (
        <main className="conversations-page">
            <ConversationToolbar
                conversationTitle={conversationTitle}
                currentCongregationId={currentCongregation?.id ?? null}
                currentCongregationName={currentCongregation?.name ?? null}
                isLibraryOpen={isLibraryOpen}
                onOpenHistory={() => openHistory()}
                onToggleLibrary={() => setIsLibraryOpen((current) => !current)}
            />

            <div
                className={`main-layout conversation-workspace${
                    isLibraryOpen ? " library-open" : ""
                }`}
            >
                {isLibraryOpen ? (
                    <LibraryPanel
                        sermons={librarySermonItems}
                        scriptures={libraryScriptureItems}
                        isAddingSermon={isAddingSermon}
                        canAddSermon={sermons.length > 0 && !isStreaming}
                        sermonPicker={
                            <ConversationSermonPicker
                                availableSermons={availableSermons}
                                disabled={isStreaming}
                                onAdd={handleAddSermonToContext}
                            />
                        }
                        onToggleSermonPicker={toggleSermonPicker}
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
                        onToggleScripturePicker={toggleScripturePicker}
                        onClose={() => setIsLibraryOpen(false)}
                    />
                ) : null}

                <div className="conversation-stage">
                    {apiError ? (
                        <div
                            className="api-error-banner"
                            role="status"
                            aria-live="polite"
                        >
                            API Error: {apiError}
                        </div>
                    ) : null}

                    <ConversationWindow
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

            <ConversationHistoryDrawer
                activeSection={activeHistorySection}
                conversationsPanel={
                    <HistoryConversationList
                        conversations={conversations}
                        selectedId={selectedConversationId}
                        onSelect={(id) => {
                            handleSelectConversation(id)
                            closeHistory()
                        }}
                        onNewConversation={() => {
                            handleNewConversation()
                            closeHistory()
                        }}
                        isLoading={isLoadingConversations}
                    />
                }
                isOpen={isHistoryOpen}
                onClose={closeHistory}
                onSectionChange={setActiveHistorySection}
                scripturePanel={
                    <HistoryScriptureList
                        scriptures={historyScriptureItems}
                        eyebrow={hasLibraryContent ? "Current references" : "History"}
                    />
                }
                sections={historySectionButtons}
                sermonsPanel={
                    <HistorySermonList
                        sermons={sermons}
                        activeSermons={activeSermons}
                        pendingSermonIds={pendingSermonIds}
                        conversationId={effectiveConversationId}
                        eyebrow={currentCongregation?.name ?? null}
                        onAttach={handleAttachSermon}
                        onDetach={handleDetachSermon}
                        onTogglePending={togglePendingSermon}
                        isDisabled={isStreaming}
                    />
                }
            />
        </main>
    )
}
