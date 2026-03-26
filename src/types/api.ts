/* API Request/Response Types */

export interface User {
    id: string
    email: string
    congregationId: string | null
    defaultBibleTranslationId: string | null
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
    defaultBibleTranslationId: string | null
    createdAt: string
    updatedAt: string
}

export interface BibleTranslation {
    id: string
    name: string
    languageCode: string
    sortOrder: number
}

export interface ScriptureCitationInput {
    translationId?: string | null
    bookId: string
    startChapter: number
    startVerse: number | null
    endVerse: number | null
}

export interface ScriptureCitation extends Omit<ScriptureCitationInput, "translationId"> {
    id: string
    translationId: string
    label: string
    createdAt: string
    updatedAt: string
}

export type CongregationPermission =
    | "super_admin"
    | "edit_profile"
    | "manage_members"
    | "manage_sermons"

export interface CongregationMemberPermission {
    id: string
    membershipId: string
    permission: CongregationPermission
}

export interface CongregationMembershipUser {
    id: string
    email: string
}

export interface CongregationMembership {
    id: string
    userId: string
    congregationId: string
    createdAt: string
    updatedAt: string
    permissions: CongregationMemberPermission[]
    user: CongregationMembershipUser
}

export interface Sermon {
    id: string
    congregationId: string
    title: string
    speaker: string | null
    recordedOn: string | null
    scriptures: ScriptureCitation[]
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
    sermon?: Sermon
}

export interface ConversationScripture {
    id: string
    conversationId: string
    scriptureCitationId: string
    removedAt: string | null
    createdAt: string
    citation?: ScriptureCitation
}

export interface ConversationEvent {
    id: string
    text: string
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

export interface ConversationRequest {
    prompt: string
    modelId: string
    conversationId?: string
    sermonIds?: string[]
    scriptureCitations?: ScriptureCitationInput[]
    isRetry?: boolean
    messageId?: string
}
