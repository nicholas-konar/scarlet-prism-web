import { useRef, useState, useEffect } from "react"
import { AVAILABLE_MODELS, ModelSelector } from "./ModelSelector"

interface MessageInputProps {
    onSubmit: (message: string) => Promise<void>
    isDisabled: boolean
    selectedModel: string
    onModelChange: (model: string) => void
}

export function MessageInput({
    onSubmit,
    isDisabled,
    selectedModel,
    onModelChange,
}: MessageInputProps) {
    const [message, setMessage] = useState("")
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const activeModel =
        AVAILABLE_MODELS.find((model) => model.id === selectedModel) ?? AVAILABLE_MODELS[0]

    useEffect(() => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = "auto"
            textarea.style.height = Math.min(textarea.scrollHeight, 220) + "px"
        }
    }, [message])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (message.trim() && !isDisabled) {
            await onSubmit(message)
            setMessage("")
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto"
            }
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !isDisabled) {
            e.preventDefault()
            handleSubmit(e as unknown as React.FormEvent)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="message-input-form-wrapper">
            <div
                className="message-input-form"
                onClick={() => textareaRef.current?.focus()}
                role="group"
                aria-label="Prompt composer"
            >
                <div className="message-input-toolbar">
                    <div className="message-input-model-block">
                        <p className="message-input-toolbar-label">Model</p>
                        <ModelSelector
                            selectedModel={selectedModel}
                            onModelChange={onModelChange}
                            disabled={isDisabled}
                        />
                    </div>
                    <div className="message-input-toolbar-copy">
                        <p className="message-input-toolbar-label">Next reply</p>
                        <p className="message-input-toolbar-note">{activeModel.detail}</p>
                    </div>
                </div>
                <div className="message-input-textarea-shell">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a Bible study question, compare sermons, or outline the next discussion."
                        aria-label="Message"
                        disabled={isDisabled}
                        rows={1}
                    />
                </div>
                <div className="message-input-footer">
                    <p className="message-input-footer-note">
                        Enter to send. Shift+Enter for a new line.
                    </p>
                    <div className="message-input-actions">
                        <p className="message-input-footer-note">
                            Uses {activeModel.label} for the next response.
                        </p>
                        <button
                            type="submit"
                            className="message-input-submit"
                            disabled={isDisabled || !message.trim()}
                        >
                            Send message
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}
