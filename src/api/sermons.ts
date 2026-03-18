import { apiCall } from "./client"
import type { Sermon, ConversationSermon, PaginatedResponse } from "@/types/api"

export async function listSermons(
    congregationId: string,
): Promise<PaginatedResponse<Sermon>> {
    return apiCall<PaginatedResponse<Sermon>>(
        `/congregations/${congregationId}/sermons?limit=50`,
        { method: "GET" },
    )
}

export async function getConversationSermons(
    conversationId: string,
): Promise<ConversationSermon[]> {
    const res = await apiCall<{ data: ConversationSermon[] }>(
        `/conversations/${conversationId}/sermons`,
        { method: "GET" },
    )
    return res.data
}

export async function attachSermon(
    conversationId: string,
    sermonId: string,
): Promise<ConversationSermon> {
    return apiCall<ConversationSermon>(
        `/conversations/${conversationId}/sermons`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sermonId }),
        },
    )
}

export async function detachSermon(
    conversationId: string,
    conversationSermonId: string,
): Promise<void> {
    await apiCall(`/conversations/${conversationId}/sermons/${conversationSermonId}`, {
        method: "DELETE",
    })
}
