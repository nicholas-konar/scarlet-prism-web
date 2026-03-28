import { Link } from "react-router-dom"
import {
    CORE_ACTION_BUTTON_CLASS,
    WORKSPACE_NAV_BUTTON_CLASS,
} from "@/components/buttonClassNames"

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
                    <Link
                        className={`${WORKSPACE_NAV_BUTTON_CLASS} conversation-toolbar-button`}
                        to="/"
                    >
                        Home
                    </Link>
                    {currentCongregationId && currentCongregationName ? (
                        <Link
                            className={`${WORKSPACE_NAV_BUTTON_CLASS} conversation-toolbar-button conversation-toolbar-button--congregation`}
                            to={`/congregations/${currentCongregationId}`}
                        >
                            {currentCongregationName}
                        </Link>
                    ) : null}
                    {currentCongregationName ? (
                        <Link
                            className={`${WORKSPACE_NAV_BUTTON_CLASS} conversation-toolbar-button`}
                            to="/admin/congregation"
                        >
                            Admin
                        </Link>
                    ) : null}
                </div>
                <button
                    type="button"
                    className={`${WORKSPACE_NAV_BUTTON_CLASS} conversation-toolbar-button conversation-toolbar-button--history`}
                    onClick={onOpenHistory}
                >
                    Open history
                </button>
            </div>
        </header>
    )
}
