interface ModelSelectorProps {
    selectedModel: string
    onModelChange: (model: string) => void
    disabled?: boolean
}

const AVAILABLE_MODELS = ["gpt-4.1-nano", "claude-3-haiku-20250307"]

export function ModelSelector({
    selectedModel,
    onModelChange,
    disabled,
}: ModelSelectorProps) {
    return (
        <fieldset className="model-selector">
            <legend>Model</legend>
            <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={disabled}
            >
                {AVAILABLE_MODELS.map((model) => (
                    <option key={model} value={model}>
                        {model}
                    </option>
                ))}
            </select>
        </fieldset>
    )
}
