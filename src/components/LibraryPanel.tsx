import type { ReactNode } from "react"

type LibrarySermonItem = {
    key: string
    label: string
    recordedOn?: string | null
    speaker?: string | null
    onDetach?: () => void
}

type LibraryScriptureItem = {
    key: string
    label: string
    source: string
    onDetach?: () => void
}

interface LibraryPanelProps {
    sermons: LibrarySermonItem[]
    scriptures: LibraryScriptureItem[]
    isAddingSermon?: boolean
    canAddSermon?: boolean
    sermonPicker?: ReactNode
    onToggleSermonPicker?: () => void
    isAddingScripture?: boolean
    canAddScripture?: boolean
    scripturePicker?: ReactNode
    onToggleScripturePicker?: () => void
    onClose?: () => void
}

export function LibraryPanel({
    sermons,
    scriptures,
    isAddingSermon,
    canAddSermon,
    sermonPicker,
    onToggleSermonPicker,
    isAddingScripture,
    canAddScripture,
    scripturePicker,
    onToggleScripturePicker,
    onClose,
}: LibraryPanelProps) {
    return (
        <aside className="library-panel panel-shell" aria-label="Conversation library">
            <div className="library-panel-header">
                <div className="library-panel-heading">
                    <div>
                        <p className="library-panel-eyebrow">Study material</p>
                        <h2>Library</h2>
                    </div>
                    <div className="library-summary-strip" aria-label="Library summary">
                        <span>{sermons.length} sermon{sermons.length === 1 ? "" : "s"}</span>
                        <span>{scriptures.length} scripture{scriptures.length === 1 ? "" : "s"}</span>
                    </div>
                </div>
                <div className="library-panel-actions">
                    {onClose ? (
                        <button
                            type="button"
                            className="ui-button ui-button--caps ui-button--compact ui-button--subtle ui-button--hover-tint ui-button--press"
                            onClick={onClose}
                            aria-label="Close context"
                        >
                            Minimize
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="library-column">
                <section className="library-section" aria-label="Sermons in library">
                    <div className="library-section-header">
                        <div className="library-section-heading">
                            <h3>Sermons</h3>
                            <span className="library-section-count">{sermons.length}</span>
                        </div>
                        <div className="library-section-actions">
                            {onToggleSermonPicker ? (
                                <button
                                    type="button"
                                    className="ui-button ui-button--caps ui-button--compact ui-button--subtle ui-button--hover-tint ui-button--press"
                                    onClick={onToggleSermonPicker}
                                    disabled={!canAddSermon}
                                >
                                    {isAddingSermon ? "Cancel" : "Add sermon"}
                                </button>
                            ) : null}
                        </div>
                    </div>
                    {isAddingSermon && sermonPicker ? (
                        <div className="library-inline-picker">
                            {sermonPicker}
                        </div>
                    ) : null}
                    {sermons.length === 0 ? (
                        <p className="library-empty-inline">No sermons in library.</p>
                    ) : (
                        <div className="library-stack">
                            {sermons.map((sermon) => (
                                <article
                                    key={sermon.key}
                                    className="library-item"
                                >
                                    <div className="library-item-main">
                                        <p className="library-item-label">
                                            {sermon.label}
                                        </p>
                                        {sermon.recordedOn || sermon.speaker ? (
                                            <div className="library-item-meta">
                                                {sermon.recordedOn ? (
                                                    <p>{sermon.recordedOn}</p>
                                                ) : null}
                                                {sermon.speaker ? (
                                                    <p>{sermon.speaker}</p>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                    {sermon.onDetach ? (
                                        <button
                                            type="button"
                                            className="ui-button ui-button--caps ui-button--compact ui-button--ghost ui-button--hover-tint ui-button--press ui-button--reveal library-item-action"
                                            onClick={sermon.onDetach}
                                        >
                                            Detach
                                        </button>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section
                    className="library-section"
                    aria-label="Scripture references in library"
                >
                    <div className="library-section-header">
                        <div className="library-section-heading">
                            <h3>Scripture</h3>
                            <span className="library-section-count">{scriptures.length}</span>
                        </div>
                        <div className="library-section-actions">
                            {onToggleScripturePicker ? (
                                <button
                                    type="button"
                                    className="ui-button ui-button--caps ui-button--compact ui-button--subtle ui-button--hover-tint ui-button--press"
                                    onClick={onToggleScripturePicker}
                                    disabled={!canAddScripture}
                                >
                                    {isAddingScripture ? "Cancel" : "Add scripture"}
                                </button>
                            ) : null}
                        </div>
                    </div>
                    {isAddingScripture && scripturePicker ? (
                        <div className="library-inline-picker library-scripture-picker">
                            {scripturePicker}
                        </div>
                    ) : null}
                    {scriptures.length === 0 ? (
                        <p className="library-empty-inline">
                            Add scripture directly or attach sermons to build the library.
                        </p>
                    ) : (
                        <div className="library-stack">
                            {scriptures.map((scripture) => (
                                <article
                                    key={scripture.key}
                                    className="library-item"
                                >
                                    <div className="library-item-main">
                                        <p className="library-item-label">
                                            {scripture.label}
                                        </p>
                                        <p className="library-item-meta">
                                            {scripture.source}
                                        </p>
                                    </div>
                                    {scripture.onDetach ? (
                                        <button
                                            type="button"
                                            className="ui-button ui-button--caps ui-button--compact ui-button--ghost ui-button--hover-tint ui-button--press ui-button--reveal library-item-action"
                                            onClick={scripture.onDetach}
                                        >
                                            Detach
                                        </button>
                                    ) : null}
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </aside>
    )
}
