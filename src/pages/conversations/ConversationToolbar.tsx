import { Link } from "react-router-dom"
import {
    CORE_ACTION_BUTTON_CLASS,
    WORKSPACE_NAV_BUTTON_CLASS,
} from "@/components/buttonClassNames"

const CLOSED_LIBRARY_ICON_PATH =
    "M5.81,2H7V9L9.5,7.5L12,9V2H18A2,2 0 0,1 20,4V20C20,21.05 19.05,22 18,22H6C4.95,22 4,21.05 4,20V4C4,3 4.83,2.09 5.81,2M13,10V13H10V15H13V20H15V15H18V13H15V10H13Z"

const OPEN_LIBRARY_ICON_PATH =
    "M12 21.5C10.65 20.65 8.2 20 6.5 20C4.85 20 3.15 20.3 1.75 21.05C1.65 21.1 1.6 21.1 1.5 21.1C1.25 21.1 1 20.85 1 20.6V6C1.6 5.55 2.25 5.25 3 5C4.11 4.65 5.33 4.5 6.5 4.5C8.45 4.5 10.55 4.9 12 6C13.45 4.9 15.55 4.5 17.5 4.5C18.67 4.5 19.89 4.65 21 5C21.75 5.25 22.4 5.55 23 6V20.6C23 20.85 22.75 21.1 22.5 21.1C22.4 21.1 22.35 21.1 22.25 21.05C20.85 20.3 19.15 20 17.5 20C15.8 20 13.35 20.65 12 21.5M11 7.5C9.64 6.9 7.84 6.5 6.5 6.5C5.3 6.5 4.1 6.65 3 7V18.5C4.1 18.15 5.3 18 6.5 18C7.84 18 9.64 18.4 11 19V7.5M13 19C14.36 18.4 16.16 18 17.5 18C18.7 18 19.9 18.15 21 18.5V7C19.9 6.65 18.7 6.5 17.5 6.5C16.16 6.5 14.36 6.9 13 7.5V19Z"

type ConversationToolbarProps = {
    conversationTitle: string
    currentCongregationId?: string | null
    currentCongregationName?: string | null
    isLibraryOpen: boolean
    onOpenHistory: () => void
    onToggleLibrary: () => void
}

export function ConversationToolbar({
    conversationTitle,
    currentCongregationId,
    currentCongregationName,
    isLibraryOpen,
    onOpenHistory,
    onToggleLibrary,
}: ConversationToolbarProps) {
    const libraryLabel = isLibraryOpen ? "Close library" : "Open library"
    const libraryIconPath = isLibraryOpen
        ? OPEN_LIBRARY_ICON_PATH
        : CLOSED_LIBRARY_ICON_PATH

    return (
        <header className="conversation-toolbar">
            <div className="conversation-toolbar-primary">
                <button
                    type="button"
                    className={`${CORE_ACTION_BUTTON_CLASS} conversation-toolbar-library-toggle`}
                    data-open={isLibraryOpen ? "true" : "false"}
                    aria-label={libraryLabel}
                    aria-pressed={isLibraryOpen}
                    onClick={onToggleLibrary}
                >
                    <span
                        className="conversation-toolbar-library-toggle-copy"
                        aria-hidden="true"
                    >
                        <span className="conversation-toolbar-library-toggle-kicker">
                            <span className="conversation-toolbar-library-toggle-kicker-dot" />
                            Study material
                        </span>
                        <span className="conversation-toolbar-library-toggle-row">
                            <span className="conversation-toolbar-library-toggle-title">
                                Library
                            </span>
                            <span className="conversation-toolbar-library-toggle-indicator">
                                <svg
                                    aria-hidden="true"
                                    className="conversation-toolbar-library-toggle-icon"
                                    viewBox="0 0 24 24"
                                >
                                    <path d={libraryIconPath} />
                                </svg>
                            </span>
                        </span>
                    </span>
                </button>
                <div className="conversation-toolbar-context">
                    <p className="conversation-toolbar-label">
                        Bible study • sermon analysis
                    </p>
                    <h1 className="conversation-toolbar-title">{conversationTitle}</h1>
                </div>
            </div>
            <div className="conversation-toolbar-actions">
                <div className="conversation-toolbar-nav-group">
                    {currentCongregationId && currentCongregationName ? (
                        <Link
                            className={`${WORKSPACE_NAV_BUTTON_CLASS} conversation-toolbar-button conversation-toolbar-button--congregation`}
                            to={`/congregations/${currentCongregationId}`}
                        >
                            <span className="conversation-toolbar-button-label">
                                {currentCongregationName}
                            </span>
                        </Link>
                    ) : null}
                    <Link
                        className={`${WORKSPACE_NAV_BUTTON_CLASS} conversation-toolbar-button conversation-toolbar-button--home`}
                        to="/"
                    >
                        <span className="conversation-toolbar-button-label">Home</span>
                    </Link>
                    {currentCongregationName ? (
                        <Link
                            className={`${WORKSPACE_NAV_BUTTON_CLASS} conversation-toolbar-button conversation-toolbar-button--admin`}
                            to="/admin/congregation"
                        >
                            <span className="conversation-toolbar-button-label">Admin</span>
                        </Link>
                    ) : null}
                </div>
                <button
                    type="button"
                    className={`${WORKSPACE_NAV_BUTTON_CLASS} conversation-toolbar-button conversation-toolbar-button--history`}
                    aria-label="Open history"
                    onClick={onOpenHistory}
                >
                    <span className="conversation-toolbar-history-icon" aria-hidden="true">
                        <svg
                            className="conversation-toolbar-history-icon-svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M4 12a8 8 0 1 0 2.34-5.66" />
                            <path d="M4 4v4h4" />
                            <path d="M12 8v4l2.5 1.5" />
                        </svg>
                    </span>
                    <span className="conversation-toolbar-history-copy">
                        <span className="conversation-toolbar-history-label">History</span>
                    </span>
                </button>
            </div>
        </header>
    )
}
