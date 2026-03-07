/* API Request/Response Types */

export interface User {
    id: string
    email: string
    createdAt: string
    updatedAt: string
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
}
