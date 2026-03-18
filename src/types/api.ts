/* API Request/Response Types */

export interface User {
    id: string
    email: string
    congregationId: string | null
    createdAt: string
    updatedAt: string
    defaultModelId?: string
}

export interface AuthResponse {
    token: string
    user: User
}

export interface SignupRequest {
    email: string
    password: string
}

export interface LoginRequest {
    email: string
    password: string
}

export interface Message {
    id: string
    conversationId: string
    role: "user" | "assistant"
    text: string
    modelId: string
    inputTokens?: number
    outputTokens?: number
    createdAt: string
}

export interface Conversation {
    id: string
    userId: string
    createdAt: string
    updatedAt: string
}

export interface Congregation {
    id: string
    name: string
    denomination: string | null
    location: string | null
    website: string | null
    about: string | null
    createdAt: string
    updatedAt: string
}

export interface Sermon {
    id: string
    congregationId: string
    title: string
    speaker: string | null
    recordedOn: string | null
    fileSizeBytes: number
    mimeType: string
    fileKey: string
    durationSeconds: number | null
    transcriptionStatus: "pending" | "transcribing" | "completed" | "failed"
    transcriptionText: string | null
    createdAt: string
    updatedAt: string
}

export interface ConversationSermon {
    id: string
    conversationId: string
    sermonId: string
    removedAt: string | null
    createdAt: string
}

export interface PaginationQuery {
    limit?: number
    cursor?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    nextCursor: string | null
}

export interface ChatRequest {
    prompt: string
    modelId: string
    conversationId?: string
    sermonIds?: string[]
    isRetry?: boolean
    messageId?: string
}
