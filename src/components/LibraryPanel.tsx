import { useState, type ReactNode } from "react"
import {
    ITEM_ACTION_BUTTON_CLASS,
    PANEL_ACTION_BUTTON_CLASS,
} from "./buttonClassNames"
import type {
    LibraryScriptureItem,
    LibrarySermonItem,
} from "@/pages/conversations/models"

export type { LibraryScriptureItem, LibrarySermonItem }

type LibraryTab = "library" | "reader"

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

function formatReaderStatusLabel(status: LibraryScriptureItem["contentStatus"]) {
    switch (status) {
        case "ready":
            return "Ready to read"
        case "hydrating":
            return "Preparing text"
        case "pending":
            return "Queued for fetch"
        case "failed":
            return "Needs refresh"
        default:
            return "Reference only"
    }
}

function getReaderStatusCopy(status: LibraryScriptureItem["contentStatus"]) {
    switch (status) {
        case "hydrating":
            return "The passage is being hydrated from the scripture provider and should appear here shortly."
        case "pending":
            return "This reference is attached, but the passage text has not been fetched yet."
        case "failed":
            return "The reference is attached, but the passage text could not be loaded from the provider."
        default:
            return "This reference is attached, but passage text is not available in the current session."
    }
}

function splitScriptureContent(contentText?: string | null) {
    if (!contentText?.trim()) {
        return []
    }

    return contentText
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
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
    detail,
    actionLabel,
    onAction,
    actionDisabled,
}: {
    title: string
    count: number
    detail: string
    actionLabel?: string
    onAction?: () => void
    actionDisabled?: boolean
}) {
    return (
        <div className="library-section-header">
            <div className="library-section-heading">
                <div className="library-section-heading-copy">
                    <p className="library-section-kicker">{title}</p>
                    <h3>{formatCountLabel(count, title.slice(0, -1).toLowerCase())}</h3>
                </div>
                <p className="library-section-detail">{detail}</p>
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

function LibraryModeTab({
    tab,
    label,
    count,
    isActive,
    onClick,
}: {
    tab: LibraryTab
    label: string
    count: number
    isActive: boolean
    onClick: (tab: LibraryTab) => void
}) {
    return (
        <button
            id={`library-panel-tab-${tab}`}
            type="button"
            role="tab"
            aria-controls={`library-panel-view-${tab}`}
            aria-selected={isActive}
            className={`library-mode-tab${isActive ? " active" : ""}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onClick(tab)}
        >
            <span>{label}</span>
            <span>{count}</span>
        </button>
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
                ) : (
                    <p className="library-item-meta">Attached as study context</p>
                )}
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
        <article className="library-item library-item--scripture">
            <div className="library-item-main">
                <div className="library-item-row">
                    <p className="library-item-label">{scripture.label}</p>
                    <span className="library-item-badge">
                        {scripture.translationLabel}
                    </span>
                </div>
                <p className="library-item-meta">
                    {scripture.source}
                    {scripture.contentStatus !== "ready"
                        ? ` • ${formatReaderStatusLabel(scripture.contentStatus)}`
                        : ""}
                </p>
            </div>
            {scripture.onDetach ? (
                <ItemActionButton label="Detach" onClick={scripture.onDetach} />
            ) : null}
        </article>
    )
}

function ScriptureReaderCard({
    scripture,
}: {
    scripture: LibraryScriptureItem
}) {
    const paragraphs = splitScriptureContent(scripture.contentText)
    const hasContent =
        scripture.contentStatus === "ready" && paragraphs.length > 0

    return (
        <article
            className={`library-reader-card library-reader-card--${scripture.contentStatus}`}
        >
            <header className="library-reader-card-header">
                <div className="library-reader-card-copy">
                    <p className="library-reader-card-kicker">
                        {formatReaderStatusLabel(scripture.contentStatus)}
                    </p>
                    <h3>{scripture.label}</h3>
                    <p className="library-reader-card-meta">
                        {scripture.translationName}
                        {scripture.translationEdition
                            ? ` • ${scripture.translationEdition}`
                            : ""}
                    </p>
                </div>
                <span className="library-reader-translation-badge">
                    {scripture.translationLabel}
                </span>
            </header>

            <div className="library-reader-source-list" aria-label="Passage sources">
                {scripture.sources.map((source) => (
                    <span
                        key={`${scripture.key}-${source}`}
                        className="library-reader-source-pill"
                    >
                        {source}
                    </span>
                ))}
            </div>

            {hasContent ? (
                <div className="library-reader-card-body">
                    {paragraphs.map((paragraph, index) => (
                        <p key={`${scripture.key}-${index}`}>{paragraph}</p>
                    ))}
                </div>
            ) : (
                <div className="library-reader-placeholder">
                    <p>{getReaderStatusCopy(scripture.contentStatus)}</p>
                </div>
            )}
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
    const [activeTab, setActiveTab] = useState<LibraryTab>("library")
    const readerReadyCount = scriptures.filter(
        (scripture) => scripture.contentStatus === "ready",
    ).length
    const readerPendingCount = scriptures.filter((scripture) =>
        ["pending", "hydrating"].includes(scripture.contentStatus),
    ).length

    return (
        <aside className="library-panel panel-shell" aria-label="Conversation library">
            <div className="library-panel-header">
                <div className="library-panel-heading">
                    <div>
                        <p className="library-panel-eyebrow">Active study material</p>
                        <h2>Library</h2>
                    </div>
                    <p className="library-panel-description">
                        Keep sermons and scripture close while the conversation
                        stays in focus.
                    </p>
                    <div className="library-summary-strip" aria-label="Library summary">
                        <span>{formatCountLabel(sermons.length, "sermon")}</span>
                        <span>{formatCountLabel(scriptures.length, "scripture")}</span>
                        <span>{formatCountLabel(readerReadyCount, "readable passage")}</span>
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

            <div className="library-panel-body">
                <div
                    className="library-mode-tabs"
                    role="tablist"
                    aria-label="Library views"
                >
                    <LibraryModeTab
                        tab="library"
                        label="Library"
                        count={sermons.length + scriptures.length}
                        isActive={activeTab === "library"}
                        onClick={setActiveTab}
                    />
                    <LibraryModeTab
                        tab="reader"
                        label="Reader"
                        count={scriptures.length}
                        isActive={activeTab === "reader"}
                        onClick={setActiveTab}
                    />
                </div>

                {activeTab === "library" ? (
                    <div
                        id="library-panel-view-library"
                        role="tabpanel"
                        aria-labelledby="library-panel-tab-library"
                        className="library-mode-view library-column"
                    >
                        <section className="library-hero" aria-label="Library overview">
                            <div className="library-hero-copy">
                                <p className="library-hero-kicker">Workspace overview</p>
                                <h3>Shape the context before you ask the next question.</h3>
                                <p>
                                    Build the conversation’s study set here, then switch
                                    to Reader when you want the passages in full.
                                </p>
                            </div>
                            <div className="library-hero-stats">
                                <div>
                                    <span>Attached sermons</span>
                                    <strong>{sermons.length}</strong>
                                </div>
                                <div>
                                    <span>Attached references</span>
                                    <strong>{scriptures.length}</strong>
                                </div>
                                <div>
                                    <span>Reader ready</span>
                                    <strong>{readerReadyCount}</strong>
                                </div>
                            </div>
                        </section>

                        <section className="library-section" aria-label="Sermons in library">
                            <LibrarySectionHeader
                                title="Sermons"
                                count={sermons.length}
                                detail="Bring in sermon context, then prune it when the thread narrows."
                                actionLabel={isAddingSermon ? "Cancel" : "Add sermon"}
                                onAction={onToggleSermonPicker}
                                actionDisabled={!canAddSermon}
                            />
                            {isAddingSermon && sermonPicker ? (
                                <div className="library-inline-picker">
                                    {sermonPicker}
                                </div>
                            ) : null}
                            {sermons.length === 0 ? (
                                <p className="library-empty-inline">
                                    No sermons are attached to this conversation yet.
                                </p>
                            ) : (
                                <div className="library-stack">
                                    {sermons.map((sermon) => (
                                        <SermonLibraryItem
                                            key={sermon.key}
                                            sermon={sermon}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        <section
                            className="library-section"
                            aria-label="Scripture references in library"
                        >
                            <LibrarySectionHeader
                                title="Scriptures"
                                count={scriptures.length}
                                detail="Attach direct references or inherit them from sermons already in context."
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
                                    Add scripture directly or attach sermons to build
                                    out the reader.
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
                ) : (
                    <div
                        id="library-panel-view-reader"
                        role="tabpanel"
                        aria-labelledby="library-panel-tab-reader"
                        className="library-mode-view library-reader-view"
                    >
                        <section className="library-reader-intro" aria-label="Reader overview">
                            <div className="library-reader-intro-copy">
                                <p className="library-reader-intro-kicker">Reader mode</p>
                                <h3>Read the attached passages without leaving the thread.</h3>
                                <p>
                                    Scroll through each citation as a quiet study stack
                                    while the conversation stays visible beside it.
                                </p>
                            </div>
                            <div className="library-reader-intro-stats">
                                <div>
                                    <span>Passages</span>
                                    <strong>{scriptures.length}</strong>
                                </div>
                                <div>
                                    <span>Readable</span>
                                    <strong>{readerReadyCount}</strong>
                                </div>
                                <div>
                                    <span>Fetching</span>
                                    <strong>{readerPendingCount}</strong>
                                </div>
                            </div>
                        </section>

                        {scriptures.length === 0 ? (
                            <div className="library-reader-empty">
                                <p className="library-reader-empty-title">
                                    No passages are attached yet.
                                </p>
                                <p>
                                    Add a scripture reference in the Library tab and it
                                    will appear here as a full reading card.
                                </p>
                            </div>
                        ) : (
                            <div className="library-reader-stack">
                                {scriptures.map((scripture) => (
                                    <ScriptureReaderCard
                                        key={scripture.key}
                                        scripture={scripture}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    )
}
