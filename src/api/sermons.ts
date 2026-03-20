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

type UploadSermonArgs = {
    congregationId: string
    title: string
    speaker?: string
    recordedOn?: string
    audio: File
}

export async function uploadSermon({
    congregationId,
    title,
    speaker,
    recordedOn,
    audio,
}: UploadSermonArgs): Promise<Sermon> {
    const body = new FormData()
    body.append("title", title)
    if (speaker) body.append("speaker", speaker)
    if (recordedOn) body.append("recordedOn", recordedOn)
    body.append("audio", audio)

    return apiCall<Sermon>(`/congregations/${congregationId}/sermons`, {
        method: "POST",
        body,
    })
}

export async function deleteSermon(
    congregationId: string,
    sermonId: string,
): Promise<void> {
    await apiCall(`/congregations/${congregationId}/sermons/${sermonId}`, {
        method: "DELETE",
    })
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
