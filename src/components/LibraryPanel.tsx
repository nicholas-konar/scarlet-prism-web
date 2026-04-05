import { useState, type ReactNode } from "react"
import {
    ITEM_ACTION_BUTTON_CLASS,
    PANEL_ACTION_BUTTON_CLASS,
} from "./buttonClassNames"
import type {
    LibraryScriptureItem,
    LibrarySermonItem,
} from "@/pages/conversations/models"
import { getLibraryScriptureStatus } from "@/pages/conversations/utils"

export type { LibraryScriptureItem, LibrarySermonItem }

type LibraryTab = "library" | "reader"

type LibraryCollectionSectionProps = {
    ariaLabel: string
    title: string
    count: number
    countLabel: string
    actionLabel?: string
    onAction?: () => void
    actionDisabled?: boolean
    picker?: ReactNode
    pickerClassName?: string
    isEmpty: boolean
    emptyMessage: string
    children: ReactNode
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

function formatCountLabel(count: number, singular: string, plural = `${singular}s`) {
    return `${count} ${count === 1 ? singular : plural}`
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

function ActionButton({
    className,
    label,
    onClick,
    disabled,
}: {
    className: string
    label: string
    onClick: () => void
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            className={className}
            onClick={onClick}
            disabled={disabled}
        >
            {label}
        </button>
    )
}

function LibraryCollectionSection({
    ariaLabel,
    title,
    count,
    countLabel,
    actionLabel,
    onAction,
    actionDisabled,
    picker,
    pickerClassName = "library-inline-picker",
    isEmpty,
    emptyMessage,
    children,
}: LibraryCollectionSectionProps) {
    return (
        <section className="library-section" aria-label={ariaLabel}>
            <div className="library-section-header">
                <div className="library-section-heading">
                    <div className="library-section-heading-row">
                        <p className="library-section-kicker">{title}</p>
                        <span
                            className="library-section-count-badge"
                            aria-label={formatCountLabel(count, countLabel)}
                            title={formatCountLabel(count, countLabel)}
                        >
                            {count}
                        </span>
                    </div>
                </div>
                <div className="library-section-actions">
                    {actionLabel && onAction ? (
                        <ActionButton
                            className={PANEL_ACTION_BUTTON_CLASS}
                            label={actionLabel}
                            onClick={onAction}
                            disabled={actionDisabled}
                        />
                    ) : null}
                </div>
            </div>
            {picker ? <div className={pickerClassName}>{picker}</div> : null}
            {isEmpty ? (
                <p className="library-empty-inline">{emptyMessage}</p>
            ) : (
                children
            )}
        </section>
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
            <span className="library-mode-tab-label">{label}</span>
            <span className="library-mode-tab-count">{count}</span>
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
                <ActionButton
                    className={ITEM_ACTION_BUTTON_CLASS}
                    label="Detach"
                    onClick={sermon.onDetach}
                />
            ) : null}
        </article>
    )
}

function ScriptureLibraryItem({
    scripture,
}: {
    scripture: LibraryScriptureItem
}) {
    const status = getLibraryScriptureStatus(scripture.contentStatus)

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
                    {scripture.contentStatus !== "ready" ? ` • ${status.label}` : ""}
                </p>
            </div>
            {scripture.onDetach ? (
                <ActionButton
                    className={ITEM_ACTION_BUTTON_CLASS}
                    label="Detach"
                    onClick={scripture.onDetach}
                />
            ) : null}
        </article>
    )
}

function ScriptureReaderCard({
    scripture,
}: {
    scripture: LibraryScriptureItem
}) {
    const status = getLibraryScriptureStatus(scripture.contentStatus)
    const paragraphs = splitScriptureContent(scripture.contentText)
    const hasContent =
        scripture.contentStatus === "ready" && paragraphs.length > 0

    return (
        <article
            className={`library-reader-card library-reader-card--${scripture.contentStatus}`}
        >
            <header className="library-reader-card-header">
                <div className="library-reader-card-copy">
                    <p className="library-reader-card-kicker">{status.label}</p>
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
                    <p>{status.placeholder}</p>
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
    const isReaderView = activeTab === "reader"
    const readerMetrics = scriptures.reduce(
        (counts, scripture) => {
            if (getLibraryScriptureStatus(scripture.contentStatus).isPending) {
                counts.pending += 1
            }
            return counts
        },
        { pending: 0 },
    )
    const panelTitle = isReaderView ? "Reader" : "Library"
    const panelDescription = isReaderView ? "Read attached passages in a quieter stack beside the thread." : "Keep sermons and references close while the thread stays in focus."
    const summaryItems = isReaderView
        ? [
              formatCountLabel(scriptures.length, "passage"),
              formatCountLabel(readerMetrics.pending, "loading", "loading"),
          ]
        : [
              formatCountLabel(sermons.length, "sermon"),
              formatCountLabel(scriptures.length, "scripture"),
          ]
    const tabs: Array<{ tab: LibraryTab; count: number }> = [
        { tab: "library", count: sermons.length + scriptures.length }, { tab: "reader", count: scriptures.length },
    ]
    const librarySections = [
        {
            key: "sermons",
            ariaLabel: "Sermons in library",
            title: "Sermons",
            count: sermons.length,
            countLabel: "sermon",
            actionLabel: isAddingSermon ? "Cancel" : "Add sermon",
            onAction: onToggleSermonPicker,
            actionDisabled: !canAddSermon,
            picker: isAddingSermon ? sermonPicker : null,
            isEmpty: sermons.length === 0,
            emptyMessage: "No sermons are attached to this conversation yet.",
            content: (
                <div className="library-stack">
                    {sermons.map((sermon) => (
                        <SermonLibraryItem key={sermon.key} sermon={sermon} />
                    ))}
                </div>
            ),
        },
        {
            key: "scriptures",
            ariaLabel: "Scripture references in library",
            title: "Scriptures",
            count: scriptures.length,
            countLabel: "scripture",
            actionLabel: isAddingScripture ? "Cancel" : "Add scripture",
            onAction: onToggleScripturePicker,
            actionDisabled: !canAddScripture,
            picker: isAddingScripture ? scripturePicker : null,
            pickerClassName: "library-inline-picker library-scripture-picker",
            isEmpty: scriptures.length === 0,
            emptyMessage:
                "Add scripture directly or attach sermons to build out the reader.",
            content: (
                <div className="library-stack">
                    {scriptures.map((scripture) => (
                        <ScriptureLibraryItem
                            key={scripture.key}
                            scripture={scripture}
                        />
                    ))}
                </div>
            ),
        },
    ]

    return (
        <aside className="library-panel panel-shell" aria-label="Conversation library">
            <div className="library-panel-topbar">
                <div
                    className="library-mode-tabs"
                    role="tablist"
                    aria-label="Library views"
                >
                    {tabs.map(({ tab, count }) => (
                        <LibraryModeTab
                            key={tab}
                            tab={tab}
                            label={tab === "library" ? "Library" : "Reader"}
                            count={count}
                            isActive={activeTab === tab}
                            onClick={setActiveTab}
                        />
                    ))}
                </div>
                {onClose ? (
                    <button
                        type="button"
                        className="library-panel-close"
                        onClick={onClose}
                        aria-label="Close library"
                    >
                        <svg
                            className="library-panel-close-svg"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M8 8l8 8" />
                            <path d="M16 8l-8 8" />
                        </svg>
                    </button>
                ) : null}
            </div>

            <div className="library-panel-scroll-region">
                <div className="library-panel-heading">
                    <div>
                        <p className="library-panel-eyebrow">Active study materials</p>
                        <div className="library-panel-title-row">
                            <h2 className="library-panel-title">{panelTitle}</h2>
                            <span className="library-panel-title-rule" aria-hidden="true" />
                        </div>
                    </div>
                    <p className="library-panel-description">
                        {panelDescription}
                    </p>
                    <div className="library-summary-strip" aria-label="Library summary">
                        {summaryItems.map((item) => (
                            <span key={item}>{item}</span>
                        ))}
                    </div>
                </div>

                <div className="library-panel-body">
                    {activeTab === "library" ? (
                        <div
                            id="library-panel-view-library"
                            role="tabpanel"
                            aria-labelledby="library-panel-tab-library"
                            className="library-mode-view library-column"
                        >
                            {librarySections.map((section) => (
                                <LibraryCollectionSection
                                    key={section.key}
                                    ariaLabel={section.ariaLabel}
                                    title={section.title}
                                    count={section.count}
                                    countLabel={section.countLabel}
                                    actionLabel={section.actionLabel}
                                    onAction={section.onAction}
                                    actionDisabled={section.actionDisabled}
                                    picker={section.picker}
                                    pickerClassName={section.pickerClassName}
                                    isEmpty={section.isEmpty}
                                    emptyMessage={section.emptyMessage}
                                >
                                    {section.content}
                                </LibraryCollectionSection>
                            ))}
                        </div>
                    ) : (
                        <div
                            id="library-panel-view-reader"
                            role="tabpanel"
                            aria-labelledby="library-panel-tab-reader"
                            className="library-mode-view library-reader-view"
                        >
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
            </div>
        </aside>
    )
}
