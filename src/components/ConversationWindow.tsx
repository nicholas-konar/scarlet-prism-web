import { useEffect, useRef, useState } from "react"
import type { Message, ConversationEvent } from "@/types/api"
import {
    PANEL_ACTION_BUTTON_CLASS,
    WORKSPACE_ACTION_BUTTON_CLASS,
} from "./buttonClassNames"
import { MessageBubble } from "./MessageBubble"
import { MessageInput } from "./MessageInput"

const NEW_CONVERSATION_PLACEHOLDER = "New Conversation"

interface ConversationWindowProps {
    conversationId: string | null
    conversationTitle?: string | null
    isLibraryOpen: boolean
    messages: Message[]
    events: ConversationEvent[]
    streamingText: string
    isStreaming: boolean
    onSendMessage: (
        message: string,
        isRetry?: boolean,
        retryMessageId?: string,
    ) => Promise<void>
    isLoading: boolean
    selectedModel: string
    onModelChange: (model: string) => void
    streamError: string | null
    lastUserMessageId: string | null
    onOpenHistory: () => void
    onRetry: () => Promise<void>
    onToggleLibrary: () => void
}

export function ConversationWindow({
    conversationId,
    conversationTitle,
    isLibraryOpen,
    messages,
    events,
    streamingText,
    isStreaming,
    onSendMessage,
    isLoading,
    selectedModel,
    onModelChange,
    streamError,
    lastUserMessageId,
    onOpenHistory,
    onRetry,
    onToggleLibrary,
}: ConversationWindowProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const titleAnimationFrameRef = useRef<number | null>(null)
    const hasInitializedTitleRef = useRef(false)
    const previousResolvedTitleRef = useRef(NEW_CONVERSATION_PLACEHOLDER)
    const resolvedConversationTitle =
        conversationTitle?.trim() || conversationId || NEW_CONVERSATION_PLACEHOLDER
    const [displayedConversationTitle, setDisplayedConversationTitle] = useState(
        resolvedConversationTitle,
    )

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
    }, [messages, events, streamingText])

    const isEmpty =
        !conversationId &&
        messages.length === 0 &&
        events.length === 0 &&
        !streamingText &&
        !streamError

    useEffect(() => {
        if (titleAnimationFrameRef.current !== null) {
            window.clearInterval(titleAnimationFrameRef.current)
            titleAnimationFrameRef.current = null
        }

        const previousResolvedTitle = previousResolvedTitleRef.current
        const titleArrivedForExistingConversation =
            !!conversationTitle?.trim() && previousResolvedTitle === conversationId

        if (!hasInitializedTitleRef.current) {
            setDisplayedConversationTitle(resolvedConversationTitle)
            hasInitializedTitleRef.current = true
            previousResolvedTitleRef.current = resolvedConversationTitle
            return
        }

        if (resolvedConversationTitle === NEW_CONVERSATION_PLACEHOLDER) {
            setDisplayedConversationTitle(NEW_CONVERSATION_PLACEHOLDER)
            previousResolvedTitleRef.current = NEW_CONVERSATION_PLACEHOLDER
            return
        }

        const shouldAnimateTitle =
            previousResolvedTitle === NEW_CONVERSATION_PLACEHOLDER ||
            titleArrivedForExistingConversation

        if (!shouldAnimateTitle) {
            setDisplayedConversationTitle(resolvedConversationTitle)
            previousResolvedTitleRef.current = resolvedConversationTitle
            return
        }

        let index = 0
        setDisplayedConversationTitle("")
        titleAnimationFrameRef.current = window.setInterval(() => {
            index += 1
            setDisplayedConversationTitle(resolvedConversationTitle.slice(0, index))

            if (index >= resolvedConversationTitle.length) {
                if (titleAnimationFrameRef.current !== null) {
                    window.clearInterval(titleAnimationFrameRef.current)
                    titleAnimationFrameRef.current = null
                }
            }
        }, 24)

        previousResolvedTitleRef.current = resolvedConversationTitle

        return () => {
            if (titleAnimationFrameRef.current !== null) {
                window.clearInterval(titleAnimationFrameRef.current)
                titleAnimationFrameRef.current = null
            }
        }
    }, [conversationId, conversationTitle, resolvedConversationTitle])

    // Merge messages and events into a single chronological list
    type Item =
        | { kind: "message"; data: (typeof messages)[0] }
        | { kind: "event"; data: (typeof events)[0] }

    const items: Item[] = [
        ...messages.map((m) => ({ kind: "message" as const, data: m })),
        ...events.map((e) => ({ kind: "event" as const, data: e })),
    ].sort((a, b) => a.data.createdAt.localeCompare(b.data.createdAt))

    return (
        <div className="conversation-window">
            <section className="messages-container panel-shell" aria-label="Conversation thread">
                <div className="panel-header panel-header-row">
                    <div className="conversation-window-header-copy">
                        <p className="panel-eyebrow">Bible study • sermon analysis</p>
                        <h2 className="panel-title">{displayedConversationTitle}</h2>
                        <div className="conversation-window-header-library-row">
                            <button
                                type="button"
                                className={WORKSPACE_ACTION_BUTTON_CLASS}
                                onClick={onToggleLibrary}
                            >
                                {isLibraryOpen ? "Close library" : "Open library"}
                            </button>
                            <p className="conversation-window-header-note">
                                <span>Add study materials to your library</span>
                                <span className="conversation-window-header-note-line">
                                    for the AI to use in this conversation.
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="conversation-window-header-actions">
                        <button
                            type="button"
                            className={PANEL_ACTION_BUTTON_CLASS}
                            onClick={onOpenHistory}
                        >
                            Open history
                        </button>
                    </div>
                </div>
                <div className="messages-scroll-area">
                    {isEmpty ? (
                        <div className="empty-state">
                            <span>Start a new conversation or select one </span>
                            <button
                                type="button"
                                className="empty-state-link"
                                onClick={onOpenHistory}
                            >
                                from history.
                            </button>
                        </div>
                    ) : (
                        <>
                            {items.map((item) =>
                                item.kind === "event" ? (
                                    <div key={item.data.id} className="event-log-entry">
                                        {item.data.text}
                                    </div>
                                ) : (
                                    <MessageBubble
                                        key={item.data.id}
                                        message={item.data}
                                        showRetry={
                                            item.data.id === lastUserMessageId &&
                                            !!streamError
                                        }
                                        onRetry={onRetry}
                                    />
                                ),
                            )}

                            {streamError && (
                                <fieldset className="message-bubble error">
                                    <legend className="message-bubble-legend">Error</legend>
                                    <div className="message-text">{streamError}</div>
                                </fieldset>
                            )}

                            {streamingText && (
                                <fieldset className="message-bubble assistant">
                                    <legend className="message-bubble-legend">
                                        {selectedModel}
                                    </legend>
                                    <div className="message-text">
                                        {streamingText}
                                        <span className="cursor">▋</span>
                                    </div>
                                </fieldset>
                            )}

                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>
            </section>

            <MessageInput
                onSubmit={onSendMessage}
                isDisabled={isStreaming || isLoading}
                selectedModel={selectedModel}
                onModelChange={onModelChange}
            />
        </div>
    )
}
