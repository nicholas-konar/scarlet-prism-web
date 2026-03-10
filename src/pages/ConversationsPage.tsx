import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useStreamChat } from "@/hooks/useStreamChat"
import { ConversationList } from "@/components/ConversationList"
import { ChatWindow } from "@/components/ChatWindow"
import * as conversationApi from "@/api/conversations"
import type { Conversation, Message } from "@/types/api"

const DEFAULT_MODEL_ID = "gpt-4.1-nano"

export function ConversationsPage() {
    const { user, logout } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const selectedConversationId = searchParams.get("id")

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoadingConversations, setIsLoadingConversations] = useState(true)
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)
    const [selectedModel, setSelectedModel] = useState(
        user?.defaultModelId || DEFAULT_MODEL_ID,
    )
    const {
        streamingText,
        isStreaming,
        conversationId: newConversationId,
        sendMessage,
        reset: resetStream,
        error: streamError,
    } = useStreamChat()

    // Load conversations on mount
    useEffect(() => {
        const loadConversations = async () => {
            try {
                setIsLoadingConversations(true)
                setApiError(null)
                const response = await conversationApi.listConversations()
                setConversations(response.data)
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                console.error("Failed to load conversations:", message)
                setApiError(message)
            } finally {
                setIsLoadingConversations(false)
            }
        }

        loadConversations()
    }, [])

    // Load messages when selected conversation changes (but not while streaming)
    useEffect(() => {
        if (!selectedConversationId) {
            // Don't clear messages if we're streaming or have errors (pending message)
            if (!isStreaming && !streamError) {
                setMessages([])
            }
            return
        }

        // Don't reload messages if we're currently streaming or have a pending error
        if (isStreaming || streamError) {
            return
        }

        const loadMessages = async () => {
            try {
                setIsLoadingMessages(true)
                const response =
                    await conversationApi.getConversationMessages(selectedConversationId)
                // Backend returns newest first, reverse for display (oldest first)
                setMessages([...response.data].reverse())
                resetStream()
            } catch (err) {
                console.error("Failed to load messages:", err)
            } finally {
                setIsLoadingMessages(false)
            }
        }

        loadMessages()
    }, [selectedConversationId, isStreaming, streamError, resetStream])

    // Update messages when streaming completes
    useEffect(() => {
        if (!isStreaming && streamingText && newConversationId) {
            // After streaming completes, reload the conversation
            // This ensures we get the final saved message with ID, tokens, etc.
            const reloadMessages = async () => {
                try {
                    const response =
                        await conversationApi.getConversationMessages(newConversationId)
                    // Backend returns newest first, reverse for display (oldest first)
                    setMessages([...response.data].reverse())
                    resetStream() // Clear streaming state
                } catch (err) {
                    console.error("Failed to reload messages:", err)
                }
            }

            const timer = setTimeout(reloadMessages, 500)
            return () => clearTimeout(timer)
        }
    }, [isStreaming, streamingText, newConversationId])

    // Sync new conversation to URL when created via streaming
    useEffect(() => {
        if (newConversationId && newConversationId !== selectedConversationId) {
            setSearchParams({ id: newConversationId })

            // Add to conversations list if not already there
            if (!conversations.find((c) => c.id === newConversationId)) {
                const newConv: Conversation = {
                    id: newConversationId,
                    userId: user!.id,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
                setConversations([newConv, ...conversations])
            }
        }
    }, [newConversationId, selectedConversationId, conversations, user])

    const handleSelectConversation = (id: string) => {
        resetStream()
        setSearchParams({ id })
    }

    const handleNewChat = async () => {
        resetStream()
        setMessages([])
        setSearchParams({})
    }

    const clearStreamError = () => {
        resetStream()
    }

    const handleSendMessage = async (message: string) => {
        try {
            clearStreamError()

            // Create temp user message for optimistic UI
            const tempMessageId = `temp-${Date.now()}`
            const tempConversationId = newConversationId || selectedConversationId
            const userMessage: Message = {
                id: tempMessageId,
                conversationId: tempConversationId || tempMessageId,
                role: "user",
                text: message,
                modelId: selectedModel,
                createdAt: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, userMessage])

            // When Phase 1 arrives with real message, replace temp with real
            const handlePhaseOneMessage = (realMessage: Message) => {
                setMessages((prev) =>
                    prev.map((msg) => (msg.id === tempMessageId ? realMessage : msg))
                )
            }

            await sendMessage(
                message,
                selectedModel,
                selectedConversationId || undefined,
                handlePhaseOneMessage,
            )
        } catch (err) {
            console.error("Failed to send message:", err)
        }
    }

    return (
        <div className="conversations-page">
            <div className="header">
                <div className="header-left">
                    <h1>Scarlet Prism</h1>
                </div>
                <div className="header-right">
                    <span className="user-email">{user?.email}</span>
                    <button className="logout-btn" onClick={logout}>
                        [logout]
                    </button>
                </div>
            </div>

            <div className="main-layout">
                <ConversationList
                    conversations={conversations}
                    selectedId={selectedConversationId}
                    onSelect={handleSelectConversation}
                    onNewChat={handleNewChat}
                    isLoading={isLoadingConversations}
                />
                {apiError && (
                    <div className="api-error-banner">API Error: {apiError}</div>
                )}

                <ChatWindow
                    conversationId={selectedConversationId}
                    messages={messages}
                    streamingText={streamingText}
                    isStreaming={isStreaming}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoadingMessages}
                    currentModelId={selectedModel}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    streamError={streamError}
                />
            </div>
        </div>
    )
}
