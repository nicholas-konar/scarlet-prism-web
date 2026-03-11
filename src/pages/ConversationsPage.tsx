import { useCallback, useEffect, useState } from "react"
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
    const [lastUserMessageId, setLastUserMessageId] = useState<string | null>(null)
    const {
        streamingText,
        isStreaming,
        conversationId: newConversationId,
        sendMessage,
        reset: resetStream,
        error: streamError,
    } = useStreamChat()

    // Fetch messages for a conversation, reversing from newest-first to oldest-first
    const fetchMessages = useCallback(async (conversationId: string) => {
        const response = await conversationApi.getConversationMessages(conversationId)
        setMessages([...response.data].reverse())
        resetStream()
    }, [resetStream])

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
            if (!isStreaming && !streamError) {
                setMessages([])
            }
            return
        }

        if (isStreaming || streamError) {
            return
        }

        const load = async () => {
            try {
                setIsLoadingMessages(true)
                await fetchMessages(selectedConversationId)
            } catch (err) {
                console.error("Failed to load messages:", err)
            } finally {
                setIsLoadingMessages(false)
            }
        }

        load()
    }, [selectedConversationId, isStreaming, streamError, fetchMessages])

    // Reload messages when streaming completes to get final saved data
    useEffect(() => {
        if (!isStreaming && streamingText && newConversationId) {
            const timer = setTimeout(() => {
                fetchMessages(newConversationId).catch((err) =>
                    console.error("Failed to reload messages:", err)
                )
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [isStreaming, streamingText, newConversationId, fetchMessages])

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

    const handleSendMessage = async (
        message: string,
        isRetry?: boolean,
        retryMessageId?: string,
    ) => {
        try {
            resetStream()
            setLastUserMessageId(null)

            const tempMessageId = isRetry && retryMessageId
                ? retryMessageId
                : `temp-${Date.now()}`

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
                setMessages((prev) => [...prev, userMessage])
            }

            const onUserMessageSucceeded = (realMessage: Message) => {
                setMessages((prev) =>
                    prev.map((msg) => (msg.id === tempMessageId ? realMessage : msg))
                )
                setLastUserMessageId(realMessage.id)
            }

            await sendMessage(
                message,
                selectedModel,
                selectedConversationId || undefined,
                onUserMessageSucceeded,
                isRetry,
                retryMessageId,
            )
        } catch (err) {
            console.error("Failed to send message:", err)
        }
    }

    const handleRetry = async () => {
        const userMessage = messages.find((msg) => msg.id === lastUserMessageId)
        if (userMessage && streamError) {
            await handleSendMessage(userMessage.text, true, userMessage.id)
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
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    streamError={streamError}
                    lastUserMessageId={lastUserMessageId}
                    onRetry={handleRetry}
                />
            </div>
        </div>
    )
}
