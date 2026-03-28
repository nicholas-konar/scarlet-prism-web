export const DEFAULT_MODEL_ID = "gpt-4.1-nano"

export type HistorySection = "conversations" | "sermons" | "scripture"

export type HistorySectionButton = {
    id: HistorySection
    label: string
    count: number
}

export type LibrarySermonItem = {
    key: string
    label: string
    recordedOn?: string | null
    speaker?: string | null
    onDetach?: () => void
}

export type LibraryScriptureItem = {
    key: string
    label: string
    source: string
    onDetach?: () => void
}

export type HistoryScriptureItem = {
    key: string
    label: string
    meta?: string
}
