import type { Message } from "@/types/api"

interface MessageBubbleProps {
    message: Message
    showRetry?: boolean
    onRetry?: () => Promise<void>
}

export function MessageBubble({ message, showRetry, onRetry }: MessageBubbleProps) {
    const isUser = message.role === "user"

    if (isUser) {
        return (
            <div className="message-with-retry">
                {showRetry && (
                    <button
                        className="retry-button"
                        onClick={onRetry}
                        aria-label="Retry AI response"
                        title="Retry"
                    >
                        ↻ retry
                    </button>
                )}
                <div className="message-bubble user">
                    <div className="message-text">{message.text}</div>
                </div>
            </div>
        )
    }

    return (
        <fieldset className="message-bubble assistant">
            <legend className="message-bubble-legend">{message.modelId}</legend>
            <div className="message-text">{message.text}</div>
        </fieldset>
    )
}
