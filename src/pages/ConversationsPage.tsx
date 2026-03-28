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
import * as sermonsApi from "@/api/sermons"
import * as scriptureApi from "@/api/scripture"
import { getEffectiveBibleTranslationId } from "@/lib/scripture"
import type { Conversation, Message, Sermon } from "@/types/api"
import { ConversationHistoryDrawer } from "./conversations/ConversationHistoryDrawer"
import { ConversationSermonPicker } from "./conversations/ConversationSermonPicker"
import { ConversationToolbar } from "./conversations/ConversationToolbar"
import { DEFAULT_MODEL_ID } from "./conversations/models"
import { useConversationDraftState } from "./conversations/useConversationDraftState"
import { useConversationHistoryDrawer } from "./conversations/useConversationHistoryDrawer"
import { useConversationWorkspaceData } from "./conversations/useConversationWorkspaceData"
import {
    buildPendingScripturePayload,
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
        sendMessage,
        reset: resetStream,
        error: streamError,
    } = useConversationStream()

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
        effectiveConversationId ||
        "New Conversation"
    const activeSermons = allConversationSermons.filter((record) => !record.removedAt)
    const activeScriptures = allConversationScriptures.filter(
        (item) => !item.removedAt,
    )

    useEffect(() => {
        if (!newConversationId || newConversationId === selectedConversationId) {
            return
        }

        setSearchParams({ id: newConversationId })
        setConversations((current) => {
            if (current.some((conversation) => conversation.id === newConversationId)) {
                return current
            }

            if (!user?.id) {
                return current
            }

            const timestamp = new Date().toISOString()
            const newConversation: Conversation = {
                id: newConversationId,
                userId: user.id,
                conversationTitle: streamedConversationTitle ?? null,
                createdAt: timestamp,
                updatedAt: timestamp,
            }

            return [newConversation, ...current]
        })
    }, [
        newConversationId,
        selectedConversationId,
        setConversations,
        setSearchParams,
        streamedConversationTitle,
        user?.id,
    ])

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

    useEffect(() => {
        if (!newConversationId) return
        resetDraftState()
    }, [newConversationId, resetDraftState])

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
    }

    async function handleSendMessage(
        message: string,
        isRetry?: boolean,
        retryMessageId?: string,
    ) {
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

                setMessages((current) => [...current, userMessage])
            }

            const onUserMessageSucceeded = (realMessage: Message) => {
                setMessages((current) =>
                    current.map((item) =>
                        item.id === tempMessageId ? realMessage : item,
                    ),
                )
                setLastUserMessageId(realMessage.id)
            }

            const isNewConversation = !selectedConversationId && !newConversationId
            const pendingScripturePayload =
                buildPendingScripturePayload(pendingUserScriptures)

            await sendMessage(
                message,
                selectedModel,
                selectedConversationId || undefined,
                onUserMessageSucceeded,
                isRetry,
                retryMessageId,
                isNewConversation && pendingSermonIds.length > 0
                    ? pendingSermonIds
                    : undefined,
                isNewConversation && pendingScripturePayload.length > 0
                    ? pendingScripturePayload
                    : undefined,
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
            const record = await sermonsApi.attachSermon(
                effectiveConversationId,
                sermon.id,
            )
            setAllConversationSermons((current) => [...current, { ...record, sermon }])
        } catch (err) {
            console.error("Failed to attach sermon:", err)
        }
    }

    async function handleAddSermonToContext(sermon: Sermon) {
        if (effectiveConversationId) {
            const alreadyAttached = activeSermons.some(
                (item) => item.sermonId === sermon.id,
            )
            if (alreadyAttached) {
                closePickers()
                return
            }

            await handleAttachSermon(sermon)
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
            await sermonsApi.detachSermon(
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

        if (effectiveConversationId) {
            const alreadyAttached = activeScriptures.some(
                (item) =>
                    item.citation && getCitationKey(item.citation) === citationKey,
            )
            if (alreadyAttached) {
                closePickers()
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
                await scriptureApi.detachScripture(
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
        activeSermons,
        pendingUserScriptures,
        pendingSermonIds,
        sermons,
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

    return (
        <main className="conversations-page">
            <ConversationToolbar
                conversationTitle={conversationTitle}
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
