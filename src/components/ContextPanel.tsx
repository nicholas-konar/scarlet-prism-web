type ContextSermonItem = {
    key: string
    label: string
    meta?: string | null
    status: "active" | "pending"
}

type ContextScriptureItem = {
    key: string
    label: string
    source: string
    status: "active" | "pending"
}

interface ContextPanelProps {
    sermons: ContextSermonItem[]
    scriptures: ContextScriptureItem[]
    isPending: boolean
    onClose?: () => void
}

export function ContextPanel({
    sermons,
    scriptures,
    isPending,
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
                    <span className={`context-status${isPending ? " pending" : ""}`}>
                        {isPending ? "pending" : "live"}
                    </span>
                    {onClose ? (
                        <button
                            type="button"
                            className="drawer-toggle drawer-dismiss"
                            onClick={onClose}
                            aria-label="Close context"
                        >
                            Hide
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
                                        className={`context-item ${sermon.status}`}
                                    >
                                        <div className="context-item-main">
                                            <p className="context-item-label">
                                                {sermon.label}
                                            </p>
                                            {sermon.meta ? (
                                                <p className="context-item-meta">
                                                    {sermon.meta}
                                                </p>
                                            ) : null}
                                        </div>
                                        <span className="context-item-badge">
                                            {sermon.status}
                                        </span>
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
                                        className={`context-item ${scripture.status}`}
                                    >
                                        <div className="context-item-main">
                                            <p className="context-item-label">
                                                {scripture.label}
                                            </p>
                                            <p className="context-item-meta">
                                                {scripture.source}
                                            </p>
                                        </div>
                                        <span className="context-item-badge">
                                            {scripture.status}
                                        </span>
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
