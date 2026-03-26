import { useRef, useState, useEffect } from "react"
import { ModelSelector } from "./ModelSelector"

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

    useEffect(() => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = "auto"
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
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
            <div className="selectors-row">
                <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={onModelChange}
                    disabled={isDisabled}
                />
            </div>
            <div
                className="message-input-form"
                onClick={() => textareaRef.current?.focus()}
                role="group"
                aria-label="Prompt composer"
            >
                <div className="panel-header">
                    <p className="panel-eyebrow">Compose</p>
                    <h2 className="panel-title">Prompt</h2>
                </div>
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="type a message... (enter to send)"
                    disabled={isDisabled}
                    rows={1}
                />
                <button type="submit" disabled={isDisabled || !message.trim()}>
                    [send →]
                </button>
            </div>
        </form>
    )
}
