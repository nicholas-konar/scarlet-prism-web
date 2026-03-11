import { useState, useCallback } from "react"
import { streamChat } from "@/api/conversations"
import type { Message } from "@/types/api"

interface UseStreamChatResult {
    streamingText: string
    isStreaming: boolean
    conversationId: string | null
    sendMessage: (
        prompt: string,
        modelId: string,
        conversationId?: string,
        onMessageReceived?: (message: Message) => void,
        isRetry?: boolean,
        messageId?: string,
    ) => Promise<void>
    error: string | null
    reset: () => void
}

export function useStreamChat(): UseStreamChatResult {
    const [streamingText, setStreamingText] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const reset = useCallback(() => {
        setStreamingText("")
        setConversationId(null)
        setError(null)
    }, [])

    const sendMessage = useCallback(
        async (
            prompt: string,
            modelId: string,
            _conversationId?: string,
            onMessageReceived?: (message: Message) => void,
            isRetry?: boolean,
            messageId?: string,
        ) => {
            setError(null)
            setIsStreaming(true)
            setStreamingText("")

            try {
                let currentConversationId = _conversationId || conversationId || undefined

                await streamChat(
                    {
                        prompt,
                        modelId,
                        conversationId: currentConversationId,
                        isRetry,
                        messageId,
                    },
                    (chunk: string) => {
                        try {
                            const event = JSON.parse(chunk)

                            // Server confirmed user message saved
                            if (event.conversationId && event.message) {
                                currentConversationId = event.conversationId
                                setConversationId(event.conversationId)
                                if (onMessageReceived) {
                                    onMessageReceived(event.message)
                                }
                            }
                            // AI response chunk
                            else if (event.delta) {
                                setStreamingText((prev) => prev + event.delta)
                            }
                            // AI response complete
                            else if (event.done) {
                                // Streaming complete
                            }
                            // Error
                            else if (event.error) {
                                setError(event.error)
                            }
                        } catch {
                            // If not JSON, log as unexpected
                            console.warn("Unexpected chunk format:", chunk)
                        }
                    },
                )
            } catch (err) {
                const message = err instanceof Error ? err.message : "Unknown error"
                setError(message)
            } finally {
                setIsStreaming(false)
            }
        },
        [conversationId],
    )

    return {
        streamingText,
        isStreaming,
        conversationId,
        sendMessage,
        error,
        reset,
    }
}
