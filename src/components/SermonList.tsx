import type { Sermon, ConversationSermon } from "@/types/api"

interface SermonListProps {
    sermons: Sermon[]
    activeSermons: ConversationSermon[]
    pendingSermonIds: string[]
    conversationId: string | null
    onAttach: (sermon: Sermon) => Promise<void>
    onDetach: (conversationSermonId: string) => Promise<void>
    onTogglePending: (sermonId: string) => void
    isDisabled?: boolean
}

export function SermonList({
    sermons,
    activeSermons,
    pendingSermonIds,
    conversationId,
    onAttach,
    onDetach,
    onTogglePending,
    isDisabled,
}: SermonListProps) {
    function getAttachedSermon(sermonId: string): ConversationSermon | undefined {
        return activeSermons.find((r) => r.sermonId === sermonId)
    }

    function isSelected(sermonId: string): boolean {
        if (conversationId) return !!getAttachedSermon(sermonId)
        return pendingSermonIds.includes(sermonId)
    }

    function handleClick(sermon: Sermon) {
        if (conversationId) {
            const attached = getAttachedSermon(sermon.id)
            if (attached) {
                onDetach(attached.id)
            } else {
                onAttach(sermon)
            }
        } else {
            onTogglePending(sermon.id)
        }
    }

    function transcriptionSuffix(status: Sermon["transcriptionStatus"]): string {
        if (status === "pending" || status === "transcribing") return " (transcribing…)"
        if (status === "failed") return " (failed)"
        return ""
    }

    function getActionLabel(sermonId: string): string {
        if (conversationId) {
            return isSelected(sermonId) ? "remove" : "add"
        }

        return isSelected(sermonId) ? "pending" : "add"
    }

    return (
        <fieldset className="sermon-list-panel">
            <legend>Sermon Browser</legend>

            <div className="list-items">
                {sermons.length === 0 ? (
                    <div className="empty-conversations">no sermons</div>
                ) : (
                    sermons.map((sermon) => {
                        const selected = isSelected(sermon.id)
                        return (
                            <button
                                key={sermon.id}
                                type="button"
                                className={`list-item${selected ? " selected" : ""}`}
                                disabled={isDisabled}
                                onClick={() => handleClick(sermon)}
                            >
                                <span className="list-item-main">
                                    <span className="label">
                                        {sermon.title}
                                        {transcriptionSuffix(sermon.transcriptionStatus)}
                                    </span>
                                    <span className="list-item-meta">
                                        {sermon.speaker ?? ""}
                                    </span>
                                </span>
                                <span className="list-item-action">
                                    {getActionLabel(sermon.id)}
                                </span>
                            </button>
                        )
                    })
                )}
            </div>
        </fieldset>
    )
}
