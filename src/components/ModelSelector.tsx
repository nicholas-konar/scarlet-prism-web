export type ModelOption = {
    id: string
    label: string
    detail: string
}

interface ModelSelectorProps {
    selectedModel: string
    onModelChange: (model: string) => void
    disabled?: boolean
}

export const AVAILABLE_MODELS: ModelOption[] = [
    {
        id: "gpt-4.1-nano",
        label: "GPT-4.1 Nano",
        detail: "Fastest replies for lightweight study questions.",
    },
    {
        id: "claude-3-haiku-20250307",
        label: "Claude 3 Haiku",
        detail: "Balanced drafting for broader sermon exploration.",
    },
]

export function ModelSelector({
    selectedModel,
    onModelChange,
    disabled,
}: ModelSelectorProps) {
    return (
        <fieldset
            className="model-selector"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <legend>Model</legend>
            <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={disabled}
                aria-label="Select a model"
            >
                {AVAILABLE_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                        {model.label}
                    </option>
                ))}
            </select>
        </fieldset>
    )
}
