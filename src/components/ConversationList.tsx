import { useState } from "react"
import type { Conversation } from "@/types/api"

interface ConversationListProps {
    conversations: Conversation[]
    selectedId: string | null
    onSelect: (id: string) => void
    onNewChat: () => void
    isLoading: boolean
}

// CSS handles ellipsis overflow, no truncation needed here

export function ConversationList({
    conversations,
    selectedId,
    onSelect,
    onNewChat,
    isLoading,
}: ConversationListProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null)
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
                            onMouseEnter={() => setHoveredId(conv.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            disabled={isLoading}
                        >
                            <span className="indicator">
                                {selectedId === conv.id || hoveredId === conv.id ? ">" : " "}
                            </span>
                            <span className="label">{conv.id}</span>
                        </button>
                    ))
                ) : (
                    <div className="empty-conversations">No conversations yet</div>
                )}
            </div>

            <div className="list-footer">
                <button className="new-chat-btn" onClick={onNewChat} disabled={isLoading}>
                    [+ new chat]
                </button>
            </div>
        </fieldset>
    )
}
