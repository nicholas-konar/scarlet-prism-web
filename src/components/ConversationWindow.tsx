import { useEffect, useRef } from "react"
import type { Message } from "@/types/api"
import { MessageBubble } from "./MessageBubble"
import { MessageInput } from "./MessageInput"

interface ConversationWindowProps {
    conversationId: string | null
    messages: Message[]
    streamingText: string
    isStreaming: boolean
    onSendMessage: (message: string, isRetry?: boolean, retryMessageId?: string) => Promise<void>
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
    }, [messages, streamingText])

    const conversationTitle = conversationId || "Conversation"
    const isEmpty = !conversationId && messages.length === 0 && !streamingText && !streamError

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
                        {messages.map((msg) => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                showRetry={msg.id === lastUserMessageId && !!streamError}
                                onRetry={onRetry}
                            />
                        ))}

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
