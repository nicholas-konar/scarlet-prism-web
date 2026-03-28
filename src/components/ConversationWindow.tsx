import { useEffect, useMemo, useRef } from "react"
import type { Message, ConversationEvent } from "@/types/api"
import { MessageBubble } from "./MessageBubble"
import { MessageInput } from "./MessageInput"

type ThreadItem =
    | { kind: "message"; data: Message }
    | { kind: "event"; data: ConversationEvent }

function buildThreadItems(
    messages: Message[],
    events: ConversationEvent[],
): ThreadItem[] {
    return [
        ...messages.map((message) => ({
            kind: "message" as const,
            data: message,
        })),
        ...events.map((event) => ({
            kind: "event" as const,
            data: event,
        })),
    ].sort((a, b) => a.data.createdAt.localeCompare(b.data.createdAt))
}

interface ConversationWindowProps {
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

    const isEmpty =
        messages.length === 0 && events.length === 0 && !streamingText && !streamError

    const items = useMemo(() => buildThreadItems(messages, events), [events, messages])

    return (
        <div className="conversation-window">
            <section className="messages-container" aria-label="Conversation thread">
                <div
                    className="messages-scroll-area"
                    role="log"
                    aria-live="polite"
                    aria-relevant="additions text"
                    aria-busy={isStreaming || isLoading}
                >
                    {isEmpty ? (
                        <div className="empty-state">
                            Start a new conversation, attach study material, or open one from
                            history.
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
                                <fieldset
                                    className="message-bubble error"
                                    role="status"
                                    aria-live="polite"
                                >
                                    <legend className="message-bubble-legend">Error</legend>
                                    <div className="message-text">{streamError}</div>
                                </fieldset>
                            )}

                            {streamingText && (
                                <fieldset className="message-bubble assistant">
                                    <legend className="message-bubble-legend">
                                        {selectedModel}
                                    </legend>
                                    <div className="message-text" aria-live="polite">
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
