import { useCallback, useState } from "react"
import type { PendingScriptureCitation } from "@/components/ScriptureCitationPicker"
import type { ConversationEvent, Sermon } from "@/types/api"
import { createConversationEvent, getCitationKey } from "./utils"

type UseConversationDraftStateArgs = {
    sermons: Sermon[]
}

type ActivePicker = "sermon" | "scripture" | null

export function useConversationDraftState({
    sermons,
}: UseConversationDraftStateArgs) {
    const [pendingSermonIds, setPendingSermonIds] = useState<string[]>([])
    const [pendingUserScriptures, setPendingUserScriptures] = useState<
        PendingScriptureCitation[]
    >([])
    const [pendingEvents, setPendingEvents] = useState<ConversationEvent[]>([])
    const [activePicker, setActivePicker] = useState<ActivePicker>(null)

    const resetDraftState = useCallback(() => {
        setPendingSermonIds([])
        setPendingUserScriptures([])
        setPendingEvents([])
        setActivePicker(null)
    }, [])

    const closePickers = useCallback(() => setActivePicker(null), [])

    const appendPendingEvent = useCallback((prefix: string, text: string) => {
        setPendingEvents((current) => [
            ...current,
            createConversationEvent(prefix, text),
        ])
    }, [])

    const toggleSermonPicker = useCallback(() => {
        setActivePicker((current) => (current === "sermon" ? null : "sermon"))
    }, [])

    const toggleScripturePicker = useCallback(() => {
        setActivePicker((current) =>
            current === "scripture" ? null : "scripture",
        )
    }, [])

    const togglePendingSermon = useCallback(
        (sermonId: string) => {
            const sermon = sermons.find((item) => item.id === sermonId)
            const title = sermon?.title ?? sermonId
            const isRemoving = pendingSermonIds.includes(sermonId)
            appendPendingEvent(
                `pending-sermon-${sermonId}`,
                isRemoving
                    ? `Removed "${title}" from new conversation`
                    : `Added "${title}" to new conversation`,
            )

            setPendingSermonIds((current) =>
                isRemoving
                    ? current.filter((id) => id !== sermonId)
                    : [...current, sermonId],
            )
        },
        [appendPendingEvent, pendingSermonIds, sermons],
    )

    const addPendingUserScripture = useCallback(
        (citation: PendingScriptureCitation) => {
            const citationKey = getCitationKey(citation)
            const alreadyPending = pendingUserScriptures.some(
                (item) => getCitationKey(item) === citationKey,
            )

            if (alreadyPending) {
                return false
            }

            setPendingUserScriptures((current) => [...current, citation])
            appendPendingEvent(
                `pending-scripture-${citationKey}`,
                `Added scripture "${citation.label}" to new conversation`,
            )

            return true
        },
        [appendPendingEvent, pendingUserScriptures],
    )

    const removePendingUserScripture = useCallback(
        (scriptureKey: string) => {
            const removed = pendingUserScriptures.find(
                (item) => getCitationKey(item) === scriptureKey,
            )
            if (!removed) {
                return
            }

            setPendingUserScriptures((current) =>
                current.filter((item) => getCitationKey(item) !== scriptureKey),
            )
            appendPendingEvent(
                `pending-scripture-remove-${scriptureKey}`,
                `Removed scripture "${removed.label}" from new conversation`,
            )
        },
        [appendPendingEvent, pendingUserScriptures],
    )

    return {
        pendingSermonIds,
        pendingUserScriptures,
        pendingEvents,
        isAddingSermon: activePicker === "sermon",
        isAddingScripture: activePicker === "scripture",
        resetDraftState,
        closePickers,
        toggleSermonPicker,
        toggleScripturePicker,
        togglePendingSermon,
        addPendingUserScripture,
        removePendingUserScripture,
    }
}
