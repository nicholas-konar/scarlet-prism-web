import type { Conversation } from "@/types/api"

interface ConversationListProps {
    conversations: Conversation[]
    selectedId: string | null
    onSelect: (id: string) => void
    onNewConversation: () => void
    isLoading: boolean
}

export function HistoryConversationList({
    conversations,
    selectedId,
    onSelect,
    onNewConversation,
    isLoading,
}: ConversationListProps) {
    function formatConversationLabel(index: number): string {
        return `Conversation ${String(index + 1).padStart(2, "0")}`
    }

    function formatConversationMeta(createdAt: string): string {
        return new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
        }).format(new Date(createdAt))
    }

    return (
        <section className="conversation-list panel-shell" aria-label="Conversation history">
            <div className="panel-header">
                <p className="panel-eyebrow">History</p>
                <h2 className="panel-title">Conversations</h2>
            </div>

            <div className="list-items">
                {conversations && conversations.length > 0 ? (
                    conversations.map((conv, index) => (
                        <button
                            key={conv.id}
                            className={`list-item ${
                                selectedId === conv.id ? "selected" : ""
                            }`}
                            onClick={() => onSelect(conv.id)}
                            disabled={isLoading}
                        >
                            <span className="list-item-main">
                                <span className="label">
                                    {formatConversationLabel(index)}
                                </span>
                                <span className="list-item-meta">
                                    {formatConversationMeta(conv.createdAt)}
                                </span>
                            </span>
                            <span className="list-item-action">
                                {selectedId === conv.id ? "open" : "view"}
                            </span>
                        </button>
                    ))
                ) : (
                    <div className="empty-conversations">No conversations yet</div>
                )}
            </div>

            <div className="list-footer">
                <button className="new-conversation-btn" onClick={onNewConversation} disabled={isLoading}>
                    [+ new conversation]
                </button>
            </div>
        </section>
    )
}
