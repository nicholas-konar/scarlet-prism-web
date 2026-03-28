import type { ReactNode } from "react"
import { PANEL_ACTION_BUTTON_CLASS } from "@/components/buttonClassNames"
import type { HistorySection, HistorySectionButton } from "./models"

const HISTORY_DRAWER_TITLE_ID = "conversation-history-title"

type ConversationHistoryDrawerProps = {
    activeSection: HistorySection
    conversationsPanel: ReactNode
    isOpen: boolean
    onClose: () => void
    onSectionChange: (section: HistorySection) => void
    scripturePanel: ReactNode
    sections: HistorySectionButton[]
    sermonsPanel: ReactNode
}

export function ConversationHistoryDrawer({
    activeSection,
    conversationsPanel,
    isOpen,
    onClose,
    onSectionChange,
    scripturePanel,
    sections,
    sermonsPanel,
}: ConversationHistoryDrawerProps) {
    if (!isOpen) {
        return null
    }

    const sectionPanels: Record<HistorySection, ReactNode> = {
        conversations: conversationsPanel,
        sermons: sermonsPanel,
        scripture: scripturePanel,
    }
    const activeTabId = `history-section-tab-${activeSection}`
    const activePanelId = `history-section-panel-${activeSection}`

    return (
        <div
            className="history-overlay"
            role="presentation"
            onClick={onClose}
        >
            <aside
                className="history-drawer panel-shell"
                role="dialog"
                aria-modal="true"
                aria-labelledby={HISTORY_DRAWER_TITLE_ID}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="history-drawer-header">
                    <div>
                        <p className="panel-eyebrow">Conversation history</p>
                        <h2 id={HISTORY_DRAWER_TITLE_ID} className="panel-title">
                            History
                        </h2>
                    </div>
                    <button
                        type="button"
                        className={PANEL_ACTION_BUTTON_CLASS}
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>

                <div
                    className="history-section-tabs"
                    role="tablist"
                    aria-label="History sections"
                >
                    {sections.map((section) => {
                        const tabId = `history-section-tab-${section.id}`
                        const panelId = `history-section-panel-${section.id}`
                        const isActive = activeSection === section.id

                        return (
                            <button
                                key={section.id}
                                id={tabId}
                                type="button"
                                role="tab"
                                aria-controls={panelId}
                                aria-selected={isActive}
                                className={`history-section-tab${
                                    isActive ? " active" : ""
                                }`}
                                tabIndex={isActive ? 0 : -1}
                                onClick={() => onSectionChange(section.id)}
                            >
                                <span>{section.label}</span>
                                <span>{section.count}</span>
                            </button>
                        )
                    })}
                </div>

                <div
                    id={activePanelId}
                    role="tabpanel"
                    aria-labelledby={activeTabId}
                    className="history-drawer-body"
                >
                    {sectionPanels[activeSection]}
                </div>
            </aside>
        </div>
    )
}
