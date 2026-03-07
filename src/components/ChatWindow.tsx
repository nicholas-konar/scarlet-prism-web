import { useEffect, useRef } from "react"
import type { Message } from "@/types/api"
import { MessageBubble } from "./MessageBubble"
import { MessageInput } from "./MessageInput"

interface ChatWindowProps {
    conversationId: string | null
    messages: Message[]
    streamingText: string
    isStreaming: boolean
    onSendMessage: (message: string) => Promise<void>
    isLoading: boolean
    currentModelId?: string
}

export function ChatWindow({
    conversationId,
    messages,
    streamingText,
    isStreaming,
    onSendMessage,
    isLoading,
    currentModelId,
}: ChatWindowProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, streamingText])

    const conversationTitle = conversationId || "Chat"
    const isEmpty = !conversationId && messages.length === 0 && !streamingText

    return (
        <div className="chat-window">
            <fieldset className="messages-container">
                <legend>{conversationTitle}</legend>
                {isEmpty ? (
                    <div className="empty-state">
                        Start a new conversation or select one from the left.
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}

                        {streamingText && (
                            <div className="message-bubble assistant streaming">
                                <div className="message-label">[{currentModelId}]</div>
                                <div className="message-text">
                                    {streamingText}
                                    <span className="cursor">▋</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </fieldset>

            <MessageInput
                onSubmit={onSendMessage}
                isDisabled={isStreaming || isLoading}
            />
        </div>
    )
}
