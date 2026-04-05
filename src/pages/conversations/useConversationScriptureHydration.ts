import { useCallback, useEffect, useRef } from "react"
import type { ConversationScripture } from "@/types/api"
import {
    conversationWorkspaceApi,
    type ConversationWorkspaceApi,
} from "./api"

type UseConversationScriptureHydrationArgs = {
    api?: Pick<ConversationWorkspaceApi, "getScriptureCitation">
    conversationId: string | null
    scriptures: ConversationScripture[]
    refreshScriptures: (conversationId: string) => Promise<void>
}

const POLL_DELAY_MS = 2000
const MAX_ATTEMPTS = 12

export function useConversationScriptureHydration({
    api = conversationWorkspaceApi,
    conversationId,
    scriptures,
    refreshScriptures,
}: UseConversationScriptureHydrationArgs) {
    const activeConversationIdRef = useRef<string | null>(conversationId)
    const attemptsRef = useRef(new Map<string, number>())
    const timersRef = useRef(new Map<string, number>())
    const inFlightRef = useRef(new Set<string>())

    const clearPolling = useCallback((citationId: string) => {
        const timer = timersRef.current.get(citationId)
        if (timer) {
            window.clearTimeout(timer)
        }

        timersRef.current.delete(citationId)
        attemptsRef.current.delete(citationId)
        inFlightRef.current.delete(citationId)
    }, [])

    const clearAllPolling = useCallback(() => {
        timersRef.current.forEach((timer) => window.clearTimeout(timer))
        timersRef.current.clear()
        attemptsRef.current.clear()
        inFlightRef.current.clear()
    }, [])

    const pollCitation = useCallback(
        async (citationId: string, attempt = 0) => {
            const currentConversationId = activeConversationIdRef.current
            if (!currentConversationId) {
                clearPolling(citationId)
                return
            }

            inFlightRef.current.add(citationId)
            const nextAttempt = attempt + 1

            const scheduleRetry = () => {
                attemptsRef.current.set(citationId, nextAttempt)
                inFlightRef.current.delete(citationId)
                const timer = window.setTimeout(() => {
                    void pollCitation(citationId, nextAttempt)
                }, POLL_DELAY_MS)
                timersRef.current.set(citationId, timer)
            }

            try {
                const citation = await api.getScriptureCitation(citationId)

                if (citation.contentStatus === "ready") {
                    clearPolling(citationId)
                    await refreshScriptures(currentConversationId)
                    return
                }

                if (citation.contentStatus === "failed") {
                    clearPolling(citationId)
                    await refreshScriptures(currentConversationId)
                    return
                }

                if (nextAttempt >= MAX_ATTEMPTS) {
                    clearPolling(citationId)
                    await refreshScriptures(currentConversationId)
                    return
                }

                scheduleRetry()
            } catch {
                clearPolling(citationId)
            }
        },
        [api, clearPolling, refreshScriptures],
    )

    useEffect(() => {
        activeConversationIdRef.current = conversationId
    }, [conversationId])

    useEffect(() => {
        if (!conversationId) {
            clearAllPolling()
            return
        }

        const pendingCitationIds = new Set(
            scriptures.flatMap((item) => {
                const citation = item.removedAt ? null : item.citation
                return citation?.id &&
                    !citation.contentText?.trim() &&
                    citation.contentStatus !== "ready"
                    ? [citation.id]
                    : []
            }),
        )

        Array.from(timersRef.current.keys()).forEach((citationId) => {
            if (!pendingCitationIds.has(citationId)) {
                clearPolling(citationId)
            }
        })

        pendingCitationIds.forEach((citationId) => {
            if (
                timersRef.current.has(citationId) ||
                inFlightRef.current.has(citationId)
            ) {
                return
            }

            const attempt = attemptsRef.current.get(citationId) ?? 0
            void pollCitation(citationId, attempt)
        })
    }, [
        clearAllPolling,
        clearPolling,
        conversationId,
        pollCitation,
        scriptures,
    ])

    useEffect(() => clearAllPolling, [clearAllPolling])
}
