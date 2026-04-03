import { useState, useCallback, useRef } from "react"
import type { Message } from "@/types/api"
import {
    conversationWorkspaceApi,
    type ConversationWorkspaceApi,
} from "@/pages/conversations/api"

interface UseConversationStreamResult {
    streamingText: string
    isStreaming: boolean
    conversationId: string | null
    conversationTitle: string | null
    initializeConversation: () => Promise<string>
    sendMessage: (
        prompt: string,
        modelId: string,
        conversationId: string,
        onMessageReceived?: (message: Message) => void,
        isRetry?: boolean,
        messageId?: string,
    ) => Promise<void>
    error: string | null
    reset: () => void
}

export function useConversationStream(
    api: Pick<
        ConversationWorkspaceApi,
        "initConversation" | "streamConversation"
    > = conversationWorkspaceApi,
): UseConversationStreamResult {
    const [streamingText, setStreamingText] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [conversationTitle, setConversationTitle] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const pendingInitializationRef = useRef<Promise<string> | null>(null)

    const reset = useCallback(() => {
        setStreamingText("")
        setConversationId(null)
        setConversationTitle(null)
        setError(null)
        pendingInitializationRef.current = null
    }, [])

    const initializeConversation = useCallback(async () => {
        if (conversationId) {
            return conversationId
        }

        if (pendingInitializationRef.current) {
            return pendingInitializationRef.current
        }

        const pendingConversation = api
            .initConversation()
            .then((id) => {
                setConversationId(id)
                return id
            })
            .finally(() => {
                pendingInitializationRef.current = null
            })

        pendingInitializationRef.current = pendingConversation
        return pendingConversation
    }, [api, conversationId])

    const sendMessage = useCallback(
        async (
            prompt: string,
            modelId: string,
            currentConversationId: string,
            onMessageReceived?: (message: Message) => void,
            isRetry?: boolean,
            messageId?: string,
        ) => {
            setError(null)
            setIsStreaming(true)
            setStreamingText("")

            try {
                await api.streamConversation(
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
        [api],
    )

    return {
        streamingText,
        isStreaming,
        conversationId,
        conversationTitle,
        initializeConversation,
        sendMessage,
        error,
        reset,
    }
}
