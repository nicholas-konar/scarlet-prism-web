import type { Sermon } from "@/types/api"
import { getSermonDisplay } from "./utils"

type ConversationSermonPickerProps = {
    availableSermons: Sermon[]
    disabled?: boolean
    onAdd: (sermon: Sermon) => Promise<void> | void
}

export function ConversationSermonPicker({
    availableSermons,
    disabled,
    onAdd,
}: ConversationSermonPickerProps) {
    if (availableSermons.length === 0) {
        return <p className="library-empty-inline">No more sermons available to add.</p>
    }

    return (
        <div className="library-picker-list">
            {availableSermons.map((sermon) => {
                const sermonDisplay = getSermonDisplay(sermon, sermon.id)

                return (
                    <button
                        key={sermon.id}
                        type="button"
                        className="library-picker-item"
                        onClick={() => {
                            void onAdd(sermon)
                        }}
                        disabled={disabled}
                    >
                        <span className="library-picker-item-main">
                            <span className="library-item-label">
                                {sermonDisplay.label}
                            </span>
                            {sermonDisplay.recordedOn || sermonDisplay.speaker ? (
                                <span className="library-item-meta">
                                    {sermonDisplay.recordedOn ? (
                                        <span>{sermonDisplay.recordedOn}</span>
                                    ) : null}
                                    {sermonDisplay.speaker ? (
                                        <span>{sermonDisplay.speaker}</span>
                                    ) : null}
                                </span>
                            ) : null}
                        </span>
                        <span className="library-picker-item-action">Add</span>
                    </button>
                )
            })}
        </div>
    )
}
