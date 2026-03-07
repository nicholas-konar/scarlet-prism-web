import type { Message } from "@/types/api"

interface MessageBubbleProps {
    message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === "user"

    if (isUser) {
        return (
            <div className={`message-bubble user`}>
                <div className="message-text">{message.text}</div>
            </div>
        )
    }

    return (
        <fieldset className={`message-bubble assistant`}>
            <legend>{message.modelId}</legend>
            <div className="message-text">{message.text}</div>
        </fieldset>
    )
}
