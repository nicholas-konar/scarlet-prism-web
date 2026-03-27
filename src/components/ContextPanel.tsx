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
}

interface ContextPanelProps {
    sermons: ContextSermonItem[]
    scriptures: ContextScriptureItem[]
    onClose?: () => void
}

export function ContextPanel({
    sermons,
    scriptures,
    onClose,
}: ContextPanelProps) {
    const hasContext = sermons.length > 0 || scriptures.length > 0

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
                            className="drawer-toggle drawer-dismiss context-panel-close"
                            onClick={onClose}
                            aria-label="Close context"
                        >
                            Minimize
                        </button>
                    ) : null}
                </div>
            </div>

            {!hasContext ? (
                <p className="context-empty">
                    Add sermons from the browser to load references into this
                    conversation.
                </p>
            ) : (
                <div className="context-column">
                    <section className="context-section" aria-label="Sermons in context">
                        <div className="context-section-header">
                            <h3>Sermons</h3>
                            <span>{sermons.length}</span>
                        </div>
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
                                                className="context-item-action"
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
                            <h3>Scripture</h3>
                            <span>{scriptures.length}</span>
                        </div>
                        {scriptures.length === 0 ? (
                            <p className="context-empty-inline">
                                Scripture will appear here as context accumulates.
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
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </aside>
    )
}
