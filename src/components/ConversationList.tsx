import type { Conversation } from "@/types/api"

interface ConversationListProps {
    conversations: Conversation[]
    selectedId: string | null
    onSelect: (id: string) => void
    onNewConversation: () => void
    isLoading: boolean
}

export function ConversationList({
    conversations,
    selectedId,
    onSelect,
    onNewConversation,
    isLoading,
}: ConversationListProps) {
    return (
        <fieldset className="conversation-list">
            <legend>Conversations</legend>

            <div className="list-items">
                {conversations && conversations.length > 0 ? (
                    conversations.map((conv) => (
                        <button
                            key={conv.id}
                            className={`list-item ${
                                selectedId === conv.id ? "selected" : ""
                            }`}
                            onClick={() => onSelect(conv.id)}
                            disabled={isLoading}
                        >
                            <span className="indicator">{">"}</span>
                            <span className="label">{conv.id}</span>
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
        </fieldset>
    )
}
