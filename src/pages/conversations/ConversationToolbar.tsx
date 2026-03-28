import { Link } from "react-router-dom"
import {
    WORKSPACE_NAV_BUTTON_CLASS,
    WORKSPACE_PRIMARY_BUTTON_CLASS,
    WORKSPACE_SECONDARY_BUTTON_CLASS,
} from "@/components/buttonClassNames"

type ConversationToolbarProps = {
    conversationTitle: string
    currentCongregationName?: string | null
    isLibraryOpen: boolean
    onOpenHistory: () => void
    onToggleLibrary: () => void
}

export function ConversationToolbar({
    conversationTitle,
    currentCongregationName,
    isLibraryOpen,
    onOpenHistory,
    onToggleLibrary,
}: ConversationToolbarProps) {
    return (
        <header className="conversation-toolbar">
            <div className="conversation-toolbar-primary">
                <button
                    type="button"
                    className={WORKSPACE_PRIMARY_BUTTON_CLASS}
                    onClick={onToggleLibrary}
                >
                    {isLibraryOpen ? "Close library" : "Open library"}
                </button>
                <div className="conversation-toolbar-context">
                    <p className="conversation-toolbar-label">
                        Bible study • sermon analysis
                    </p>
                    <h1 className="conversation-toolbar-title">{conversationTitle}</h1>
                </div>
            </div>
            <div className="conversation-toolbar-actions">
                {currentCongregationName ? (
                    <span className="congregation-name">{currentCongregationName}</span>
                ) : null}
                <Link className={WORKSPACE_NAV_BUTTON_CLASS} to="/">
                    Home
                </Link>
                {currentCongregationName ? (
                    <Link
                        className={WORKSPACE_NAV_BUTTON_CLASS}
                        to="/admin/congregation"
                    >
                        Admin
                    </Link>
                ) : null}
                <button
                    type="button"
                    className={WORKSPACE_SECONDARY_BUTTON_CLASS}
                    onClick={onOpenHistory}
                >
                    Open history
                </button>
            </div>
        </header>
    )
}
