import { useState, useCallback } from "react"
import { streamChat } from "@/api/conversations"

interface UseStreamChatResult {
    streamingText: string
    isStreaming: boolean
    conversationId: string | null
    sendMessage: (
        prompt: string,
        modelId: string,
        conversationId?: string,
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
        ) => {
            setError(null)
            setIsStreaming(true)
            setStreamingText("")

            try {
                let currentConversationId = _conversationId || conversationId

                await streamChat(
                    {
                        prompt,
                        modelId,
                        conversationId: currentConversationId,
                    },
                    (chunk: string) => {
                        try {
                            const event = JSON.parse(chunk)

                            // Check for conversation ID
                            if (event.id) {
                                currentConversationId = event.id
                                setConversationId(event.id)
                            }
                            // Check for text delta
                            else if (event.delta) {
                                setStreamingText((prev) => prev + event.delta)
                            }
                            // Check for completion
                            else if (event.done) {
                                // Streaming complete
                            }
                            // Check for error
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
