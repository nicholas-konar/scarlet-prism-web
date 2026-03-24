import { ScriptureCitationPicker, type PendingScriptureCitation } from "./ScriptureCitationPicker"
import type { BibleTranslation } from "@/types/api"

type ManualScriptureItem = {
    id: string
    label: string
    translationId: string
    removeLabel: string
    onRemove: () => void
}

type ScriptureContextItem = {
    key: string
    label: string
    translationId: string
    sources: string[]
}

type ScripturePanelProps = {
    translations: BibleTranslation[]
    defaultTranslationId: string
    disabled?: boolean
    onAdd: (citation: PendingScriptureCitation) => void
    manualItems: ManualScriptureItem[]
    contextItems: ScriptureContextItem[]
}

export function ScripturePanel({
    translations,
    defaultTranslationId,
    disabled,
    onAdd,
    manualItems,
    contextItems,
}: ScripturePanelProps) {
    return (
        <fieldset className="panel form-panel scripture-panel">
            <legend>Scripture</legend>

            <div className="section-heading">
                <h2>Scripture context</h2>
            </div>

            <ScriptureCitationPicker
                translations={translations}
                defaultTranslationId={defaultTranslationId}
                disabled={disabled}
                onAdd={onAdd}
            />

            <div className="scripture-block">
                <h3>Manual selections</h3>
                {manualItems.length === 0 ? (
                    <p className="panel-copy">No manual scripture selected.</p>
                ) : (
                    <div className="scripture-chip-list">
                        {manualItems.map((item) => (
                            <div key={item.id} className="scripture-chip">
                                <div>
                                    <strong>{item.label}</strong>
                                    <div className="meta-copy">
                                        {item.translationId.toUpperCase()}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={item.onRemove}
                                    disabled={disabled}
                                >
                                    {item.removeLabel}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="scripture-block">
                <h3>Current context</h3>
                {contextItems.length === 0 ? (
                    <p className="panel-copy">No scripture in context yet.</p>
                ) : (
                    <div className="scripture-chip-list">
                        {contextItems.map((item) => (
                            <div key={item.key} className="scripture-chip">
                                <div>
                                    <strong>{item.label}</strong>
                                    <div className="meta-copy">
                                        {item.translationId.toUpperCase()} | {item.sources.join(", ")}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </fieldset>
    )
}
