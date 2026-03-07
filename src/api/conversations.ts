import { apiCall, apiStream } from "./client"
import type { Conversation, Message, ChatRequest, PaginatedResponse } from "@/types/api"

export async function listConversations(
    limit?: number,
    cursor?: string,
): Promise<PaginatedResponse<Conversation>> {
    const params = new URLSearchParams()
    if (limit) params.append("limit", limit.toString())
    if (cursor) params.append("cursor", cursor)

    const queryString = params.toString()
    const url = `/conversations${queryString ? "?" + queryString : ""}`

    return apiCall<PaginatedResponse<Conversation>>(url, {
        method: "GET",
    })
}

export async function getConversationMessages(
    conversationId: string,
    limit?: number,
    cursor?: string,
): Promise<PaginatedResponse<Message>> {
    const params = new URLSearchParams()
    if (limit) params.append("limit", limit.toString())
    if (cursor) params.append("cursor", cursor)

    const queryString = params.toString()
    const url = `/conversations/${conversationId}${queryString ? "?" + queryString : ""}`

    return apiCall<PaginatedResponse<Message>>(url, {
        method: "GET",
    })
}

export async function streamChat(
    data: ChatRequest,
    onChunk: (chunk: string) => void,
): Promise<void> {
    // Use /conversations for new chats, /conversations/:id for existing
    const endpoint = data.conversationId
        ? `/conversations/${data.conversationId}`
        : "/conversations"

    // Strip conversationId from body since it goes in URL for existing chats
    const body = data.conversationId
        ? { prompt: data.prompt, modelId: data.modelId }
        : data

    return apiStream(
        endpoint,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        },
        onChunk,
    )
}
