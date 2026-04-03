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

const POLL_DELAY_MS = 500
const MAX_ATTEMPTS = 12
const MAX_FAILED_ATTEMPTS = 8

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

            try {
                const citation = await api.getScriptureCitation(citationId)
                const nextAttempt = attempt + 1

                if (citation.contentStatus === "ready") {
                    clearPolling(citationId)
                    await refreshScriptures(currentConversationId)
                    return
                }

                const reachedAttemptLimit =
                    citation.contentStatus === "failed"
                        ? nextAttempt >= MAX_FAILED_ATTEMPTS
                        : nextAttempt >= MAX_ATTEMPTS

                if (reachedAttemptLimit) {
                    clearPolling(citationId)
                    await refreshScriptures(currentConversationId)
                    return
                }

                attemptsRef.current.set(citationId, nextAttempt)
                inFlightRef.current.delete(citationId)
                const timer = window.setTimeout(() => {
                    void pollCitation(citationId, nextAttempt)
                }, POLL_DELAY_MS)
                timersRef.current.set(citationId, timer)
            } catch (error) {
                const nextAttempt = attempt + 1

                if (nextAttempt >= MAX_FAILED_ATTEMPTS) {
                    clearPolling(citationId)
                    return
                }

                attemptsRef.current.set(citationId, nextAttempt)
                inFlightRef.current.delete(citationId)
                const timer = window.setTimeout(() => {
                    void pollCitation(citationId, nextAttempt)
                }, POLL_DELAY_MS)
                timersRef.current.set(citationId, timer)
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
            scriptures
                .filter((item) => !item.removedAt && item.citation?.id)
                .filter(
                    (item) =>
                        !item.citation?.contentText?.trim() &&
                        item.citation?.contentStatus !== "ready",
                )
                .map((item) => item.citation!.id),
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
