import type { ReactNode } from "react"

type ContextSermonItem = {
    key: string
    label: string
    recordedOn?: string | null
    speaker?: string | null
    onDetach?: () => void
}

type ContextScriptureItem = {
    key: string
    label: string
    source: string
    onDetach?: () => void
}

interface ContextPanelProps {
    sermons: ContextSermonItem[]
    scriptures: ContextScriptureItem[]
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

export function ContextPanel({
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
}: ContextPanelProps) {
    return (
        <aside className="context-panel panel-shell" aria-label="Conversation context">
            <div className="context-panel-header">
                <div className="context-panel-heading">
                    <div>
                        <p className="context-panel-eyebrow">Workspace context</p>
                        <h2>Context</h2>
                    </div>
                    <div className="context-summary-strip" aria-label="Context summary">
                        <span>{sermons.length} sermon{sermons.length === 1 ? "" : "s"}</span>
                        <span>{scriptures.length} scripture{scriptures.length === 1 ? "" : "s"}</span>
                    </div>
                </div>
                <div className="context-panel-actions">
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

            <div className="context-column">
                <section className="context-section" aria-label="Sermons in context">
                    <div className="context-section-header">
                        <div className="context-section-heading">
                            <h3>Sermons</h3>
                            <span className="context-section-count">{sermons.length}</span>
                        </div>
                        <div className="context-section-actions">
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
                        <div className="context-inline-picker">
                            {sermonPicker}
                        </div>
                    ) : null}
                    {sermons.length === 0 ? (
                        <p className="context-empty-inline">No sermons in context.</p>
                    ) : (
                        <div className="context-stack">
                            {sermons.map((sermon) => (
                                <article
                                    key={sermon.key}
                                    className="context-item"
                                >
                                    <div className="context-item-main">
                                        <p className="context-item-label">
                                            {sermon.label}
                                        </p>
                                        {sermon.recordedOn || sermon.speaker ? (
                                            <div className="context-item-meta">
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
                                            className="ui-button ui-button--caps ui-button--compact ui-button--ghost ui-button--hover-tint ui-button--press ui-button--reveal context-item-action"
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
                    className="context-section"
                    aria-label="Scripture references in context"
                >
                    <div className="context-section-header">
                        <div className="context-section-heading">
                            <h3>Scripture</h3>
                            <span className="context-section-count">{scriptures.length}</span>
                        </div>
                        <div className="context-section-actions">
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
                        <div className="context-inline-picker context-scripture-picker">
                            {scripturePicker}
                        </div>
                    ) : null}
                    {scriptures.length === 0 ? (
                        <p className="context-empty-inline">
                            Add scripture directly or attach sermons to build context.
                        </p>
                    ) : (
                        <div className="context-stack">
                            {scriptures.map((scripture) => (
                                <article
                                    key={scripture.key}
                                    className="context-item"
                                >
                                    <div className="context-item-main">
                                        <p className="context-item-label">
                                            {scripture.label}
                                        </p>
                                        <p className="context-item-meta">
                                            {scripture.source}
                                        </p>
                                    </div>
                                    {scripture.onDetach ? (
                                        <button
                                            type="button"
                                            className="ui-button ui-button--caps ui-button--compact ui-button--ghost ui-button--hover-tint ui-button--press ui-button--reveal context-item-action"
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
