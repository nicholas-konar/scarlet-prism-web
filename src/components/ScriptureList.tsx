type ScriptureListItem = {
    key: string
    label: string
}

interface ScriptureListProps {
    scriptures: ScriptureListItem[]
}

export function ScriptureList({ scriptures }: ScriptureListProps) {
    return (
        <fieldset className="scripture-list-panel">
            <legend>Scripture</legend>

            <div className="list-items">
                {scriptures.length === 0 ? (
                    <div className="empty-conversations">
                        No scripture in context
                    </div>
                ) : (
                    scriptures.map((scripture) => (
                        <div key={scripture.key} className="list-item static">
                            <span className="label">{scripture.label}</span>
                        </div>
                    ))
                )}
            </div>
        </fieldset>
    )
}
