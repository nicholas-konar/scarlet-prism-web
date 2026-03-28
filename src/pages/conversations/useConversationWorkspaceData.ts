import { useCallback, useEffect, useState } from "react"
import * as conversationApi from "@/api/conversations"
import * as sermonsApi from "@/api/sermons"
import * as scriptureApi from "@/api/scripture"
import type {
    BibleTranslation,
    Conversation,
    ConversationScripture,
    ConversationSermon,
    Message,
    Sermon,
} from "@/types/api"

type UseConversationWorkspaceDataArgs = {
    currentCongregationId: string | null
    isStreaming: boolean
    newConversationId: string | null
    resetStream: () => void
    selectedConversationId: string | null
    streamError: string | null
    streamingText: string
}

export function useConversationWorkspaceData({
    currentCongregationId,
    isStreaming,
    newConversationId,
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
            const response = await conversationApi.getConversationMessages(
                conversationId,
            )
            setMessages([...response.data].reverse())
            resetStream()
        },
        [resetStream],
    )

    const fetchConversationSermons = useCallback(async (conversationId: string) => {
        try {
            const records = await sermonsApi.getConversationSermons(conversationId)
            setAllConversationSermons(records)
        } catch {
            setAllConversationSermons([])
        }
    }, [])

    const fetchConversationScriptures = useCallback(
        async (conversationId: string) => {
            try {
                const records = await scriptureApi.getConversationScriptures(
                    conversationId,
                )
                setAllConversationScriptures(records)
            } catch {
                setAllConversationScriptures([])
            }
        },
        [],
    )

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoadingConversations(true)
                setApiError(null)
                const response = await conversationApi.listConversations()
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
    }, [])

    useEffect(() => {
        scriptureApi
            .listBibleTranslations()
            .then(setTranslations)
            .catch(() => setTranslations([]))
    }, [])

    useEffect(() => {
        if (!currentCongregationId) {
            setSermons([])
            return
        }

        sermonsApi
            .listSermons(currentCongregationId)
            .then((response) => setSermons(response.data))
            .catch(() => setSermons([]))
    }, [currentCongregationId])

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
                await Promise.all([
                    fetchMessages(selectedConversationId),
                    fetchConversationSermons(selectedConversationId),
                    fetchConversationScriptures(selectedConversationId),
                ])
            } catch (error) {
                console.error("Failed to load conversation:", error)
            } finally {
                setIsLoadingMessages(false)
            }
        }

        void load()
    }, [
        clearConversationResources,
        fetchConversationScriptures,
        fetchConversationSermons,
        fetchMessages,
        isStreaming,
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
