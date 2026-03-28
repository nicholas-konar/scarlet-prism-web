import type { HistoryScriptureItem } from "@/pages/conversations/models"

interface ScriptureListProps {
    scriptures: HistoryScriptureItem[]
    eyebrow?: string | null
}

export function HistoryScriptureList({
    scriptures,
    eyebrow = "History",
}: ScriptureListProps) {
    return (
        <section className="scripture-list-panel panel-shell" aria-label="Scripture browser">
            <div className="panel-header">
                <p className="panel-eyebrow">{eyebrow}</p>
                <h2 className="panel-title">Scripture</h2>
            </div>

            <div className="list-items">
                {scriptures.length === 0 ? (
                    <div className="empty-conversations">
                        No scripture available
                    </div>
                ) : (
                    scriptures.map((scripture) => (
                        <div key={scripture.key} className="list-item static">
                            <span className="list-item-main">
                                <span className="label">{scripture.label}</span>
                                {scripture.meta ? (
                                    <span className="list-item-meta">
                                        {scripture.meta}
                                    </span>
                                ) : null}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </section>
    )
}
