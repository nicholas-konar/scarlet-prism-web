import { useRef, useState, useEffect } from "react"
import { CORE_ACTION_BUTTON_CLASS } from "@/components/buttonClassNames"
import { AVAILABLE_MODELS, ModelSelector } from "./ModelSelector"

function resizeTextarea(textarea: HTMLTextAreaElement | null) {
    if (!textarea) return

    textarea.style.height = "auto"
    textarea.style.height = Math.min(textarea.scrollHeight, 220) + "px"
}

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
        resizeTextarea(textareaRef.current)
    }, [message])

    const submitMessage = async () => {
        if (message.trim() && !isDisabled) {
            await onSubmit(message)
            setMessage("")
            resizeTextarea(textareaRef.current)
        }
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        await submitMessage()
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey && !isDisabled) {
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="message-input-form-wrapper">
            <fieldset className="message-input-form">
                <legend className="visually-hidden">Prompt composer</legend>
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
                        name="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a Bible study question, compare sermons, or outline the next discussion."
                        aria-label="Message"
                        autoComplete="off"
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
                            className={`message-input-submit ${CORE_ACTION_BUTTON_CLASS}`}
                            disabled={isDisabled || !message.trim()}
                        >
                            Send message
                        </button>
                    </div>
                </div>
            </fieldset>
        </form>
    )
}
