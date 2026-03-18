import { useEffect, useRef } from "react"
import type { Message, ConversationEvent } from "@/types/api"
import { MessageBubble } from "./MessageBubble"
import { MessageInput } from "./MessageInput"

interface ConversationWindowProps {
    conversationId: string | null
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
    onRetry: () => Promise<void>
}

export function ConversationWindow({
    conversationId,
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
    onRetry,
}: ConversationWindowProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
    }, [messages, events, streamingText])

    const conversationTitle = conversationId || "New Conversation"
    const isEmpty =
        !conversationId &&
        messages.length === 0 &&
        events.length === 0 &&
        !streamingText &&
        !streamError

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
            <fieldset className="messages-container">
                <legend>{conversationTitle}</legend>
                {isEmpty ? (
                    <div className="empty-state">
                        Start a new conversation or select one from the left.
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
                                <legend>error</legend>
                                <div className="message-text">{streamError}</div>
                            </fieldset>
                        )}

                        {streamingText && (
                            <fieldset className="message-bubble assistant">
                                <legend>{selectedModel}</legend>
                                <div className="message-text">
                                    {streamingText}
                                    <span className="cursor">▋</span>
                                </div>
                            </fieldset>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </fieldset>

            <MessageInput
                onSubmit={onSendMessage}
                isDisabled={isStreaming || isLoading}
                selectedModel={selectedModel}
                onModelChange={onModelChange}
            />
        </div>
    )
}
