import { useCallback, useEffect, useState } from "react"
import type {
    BibleTranslation,
    Conversation,
    ConversationScripture,
    ConversationSermon,
    Message,
    Sermon,
} from "@/types/api"
import {
    conversationWorkspaceApi,
    type ConversationWorkspaceApi,
} from "./api"

type UseConversationWorkspaceDataArgs = {
    currentCongregationId: string | null
    isStreaming: boolean
    newConversationId: string | null
    api?: ConversationWorkspaceApi
    resetStream: () => void
    selectedConversationId: string | null
    streamError: string | null
    streamingText: string
}

export function useConversationWorkspaceData({
    currentCongregationId,
    isStreaming,
    newConversationId,
    api = conversationWorkspaceApi,
    resetStream,
    selectedConversationId,
    streamError,
    streamingText,
}: UseConversationWorkspaceDataArgs) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [sermons, setSermons] = useState<Sermon[]>([])
    const [translations, setTranslations] = useState<BibleTranslation[]>([])
    const [allConversationSermons, setAllConversationSermons] = useState<
        ConversationSermon[]
    >([])
    const [allConversationScriptures, setAllConversationScriptures] = useState<
        ConversationScripture[]
    >([])
    const [isLoadingConversations, setIsLoadingConversations] = useState(true)
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)

    const clearConversationResources = useCallback(() => {
        setMessages([])
        setAllConversationSermons([])
        setAllConversationScriptures([])
    }, [])

    const fetchMessages = useCallback(
        async (conversationId: string) => {
            const response = await api.getConversationMessages(conversationId)
            setMessages([...response.data].reverse())
            resetStream()
        },
        [api, resetStream],
    )

    const fetchConversationSermons = useCallback(
        async (conversationId: string) =>
            setAllConversationSermons(
                await api.getConversationSermons(conversationId).catch(() => []),
            ),
        [api],
    )

    const fetchConversationScriptures = useCallback(
        async (conversationId: string) =>
            setAllConversationScriptures(
                await api.getConversationScriptures(conversationId).catch(() => []),
            ),
        [api],
    )

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoadingConversations(true)
                setApiError(null)
                const response = await api.listConversations()
                setConversations(response.data)
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error)
                setApiError(message)
            } finally {
                setIsLoadingConversations(false)
            }
        }

        void load()
    }, [api])

    useEffect(() => {
        api.listBibleTranslations()
            .then(setTranslations)
            .catch(() => setTranslations([]))
    }, [api])

    useEffect(() => {
        if (!currentCongregationId) {
            setSermons([])
            return
        }

        api.listSermons(currentCongregationId)
            .then((response) => setSermons(response.data))
            .catch(() => setSermons([]))
    }, [api, currentCongregationId])

    useEffect(() => {
        if (!selectedConversationId) {
            if (!isStreaming && !streamError) {
                clearConversationResources()
            }
            return
        }

        if (isStreaming || streamError) return

        const load = async () => {
            try {
                setIsLoadingMessages(true)
                const resources =
                    await api.loadConversationResources(selectedConversationId)
                setMessages(resources.messages)
                setAllConversationSermons(resources.sermons)
                setAllConversationScriptures(resources.scriptures)
                resetStream()
            } catch (error) {
                console.error("Failed to load conversation:", error)
            } finally {
                setIsLoadingMessages(false)
            }
        }

        void load()
    }, [
        api,
        clearConversationResources,
        isStreaming,
        resetStream,
        selectedConversationId,
        streamError,
    ])

    useEffect(() => {
        if (!isStreaming && streamingText && newConversationId) {
            const timer = window.setTimeout(() => {
                void fetchMessages(newConversationId).catch(console.error)
            }, 500)

            return () => window.clearTimeout(timer)
        }
    }, [fetchMessages, isStreaming, newConversationId, streamingText])

    useEffect(() => {
        if (!newConversationId) return

        void fetchConversationSermons(newConversationId)
        void fetchConversationScriptures(newConversationId)
    }, [
        fetchConversationScriptures,
        fetchConversationSermons,
        newConversationId,
    ])

    return {
        conversations,
        setConversations,
        messages,
        setMessages,
        sermons,
        translations,
        allConversationSermons,
        setAllConversationSermons,
        allConversationScriptures,
        setAllConversationScriptures,
        isLoadingConversations,
        isLoadingMessages,
        apiError,
        clearConversationResources,
        fetchConversationScriptures,
    }
}
