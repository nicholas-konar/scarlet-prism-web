import type { ReactNode } from "react"
import {
    ITEM_ACTION_BUTTON_CLASS,
    PANEL_ACTION_BUTTON_CLASS,
} from "./buttonClassNames"

export type LibrarySermonItem = {
    key: string
    label: string
    recordedOn?: string | null
    speaker?: string | null
    onDetach?: () => void
}

export type LibraryScriptureItem = {
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

function formatCountLabel(count: number, singular: string) {
    return `${count} ${singular}${count === 1 ? "" : "s"}`
}

function PanelActionButton({
    label,
    onClick,
    disabled,
}: {
    label: string
    onClick: () => void
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            className={PANEL_ACTION_BUTTON_CLASS}
            onClick={onClick}
            disabled={disabled}
        >
            {label}
        </button>
    )
}

function ItemActionButton({
    label,
    onClick,
}: {
    label: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            className={ITEM_ACTION_BUTTON_CLASS}
            onClick={onClick}
        >
            {label}
        </button>
    )
}

function LibrarySectionHeader({
    title,
    count,
    actionLabel,
    onAction,
    actionDisabled,
}: {
    title: string
    count: number
    actionLabel?: string
    onAction?: () => void
    actionDisabled?: boolean
}) {
    return (
        <div className="library-section-header">
            <div className="library-section-heading">
                <h3>{title}</h3>
                <span className="library-section-count">{count}</span>
            </div>
            <div className="library-section-actions">
                {actionLabel && onAction ? (
                    <PanelActionButton
                        label={actionLabel}
                        onClick={onAction}
                        disabled={actionDisabled}
                    />
                ) : null}
            </div>
        </div>
    )
}

function SermonLibraryItem({ sermon }: { sermon: LibrarySermonItem }) {
    const hasMeta = sermon.recordedOn || sermon.speaker

    return (
        <article className="library-item">
            <div className="library-item-main">
                <p className="library-item-label">{sermon.label}</p>
                {hasMeta ? (
                    <div className="library-item-meta">
                        {sermon.recordedOn ? <p>{sermon.recordedOn}</p> : null}
                        {sermon.speaker ? <p>{sermon.speaker}</p> : null}
                    </div>
                ) : null}
            </div>
            {sermon.onDetach ? (
                <ItemActionButton label="Detach" onClick={sermon.onDetach} />
            ) : null}
        </article>
    )
}

function ScriptureLibraryItem({
    scripture,
}: {
    scripture: LibraryScriptureItem
}) {
    return (
        <article className="library-item">
            <div className="library-item-main">
                <p className="library-item-label">{scripture.label}</p>
                <p className="library-item-meta">{scripture.source}</p>
            </div>
            {scripture.onDetach ? (
                <ItemActionButton label="Detach" onClick={scripture.onDetach} />
            ) : null}
        </article>
    )
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
                        <p className="library-panel-eyebrow">Active study material</p>
                        <h2>Library</h2>
                    </div>
                    <div className="library-summary-strip" aria-label="Library summary">
                        <span>{formatCountLabel(sermons.length, "sermon")}</span>
                        <span>{formatCountLabel(scriptures.length, "scripture")}</span>
                    </div>
                </div>
                <div className="library-panel-actions">
                    {onClose ? (
                        <button
                            type="button"
                            className={PANEL_ACTION_BUTTON_CLASS}
                            onClick={onClose}
                            aria-label="Close library"
                        >
                            Close
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="library-column">
                <section className="library-section" aria-label="Sermons in library">
                    <LibrarySectionHeader
                        title="Sermons"
                        count={sermons.length}
                        actionLabel={isAddingSermon ? "Cancel" : "Add sermon"}
                        onAction={onToggleSermonPicker}
                        actionDisabled={!canAddSermon}
                    />
                    {isAddingSermon && sermonPicker ? (
                        <div className="library-inline-picker">{sermonPicker}</div>
                    ) : null}
                    {sermons.length === 0 ? (
                        <p className="library-empty-inline">No active sermons in library.</p>
                    ) : (
                        <div className="library-stack">
                            {sermons.map((sermon) => (
                                <SermonLibraryItem key={sermon.key} sermon={sermon} />
                            ))}
                        </div>
                    )}
                </section>

                <section
                    className="library-section"
                    aria-label="Scripture references in library"
                >
                    <LibrarySectionHeader
                        title="Scripture"
                        count={scriptures.length}
                        actionLabel={
                            isAddingScripture ? "Cancel" : "Add scripture"
                        }
                        onAction={onToggleScripturePicker}
                        actionDisabled={!canAddScripture}
                    />
                    {isAddingScripture && scripturePicker ? (
                        <div className="library-inline-picker library-scripture-picker">
                            {scripturePicker}
                        </div>
                    ) : null}
                    {scriptures.length === 0 ? (
                        <p className="library-empty-inline">
                            Add scripture directly or attach sermons to build the
                            library.
                        </p>
                    ) : (
                        <div className="library-stack">
                            {scriptures.map((scripture) => (
                                <ScriptureLibraryItem
                                    key={scripture.key}
                                    scripture={scripture}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </aside>
    )
}
