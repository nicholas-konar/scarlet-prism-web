import type { Message } from "@/types/api"

interface MessageBubbleProps {
    message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === "user"
    const status = message.status || "persisted"
    const isFailed = status === "failed"

    if (isUser) {
        return (
            <div className={`message-bubble user ${isFailed ? "failed" : ""}`}>
                <div className="message-text">{message.text}</div>
                {isFailed && message.error && (
                    <div className="message-status">Failed: {message.error}</div>
                )}
            </div>
        )
    }

    return (
        <fieldset className={`message-bubble assistant ${isFailed ? "failed" : ""}`}>
            <legend>{message.modelId}</legend>
            <div className="message-text">{message.text}</div>
            {isFailed && message.error && (
                <div className="message-status">Failed: {message.error}</div>
            )}
        </fieldset>
    )
}
