import { apiCall } from "./client"
import type {
    BibleTranslation,
    ConversationScripture,
    ScriptureCitationDetail,
    ScriptureCitationInput,
} from "@/types/api"

export async function listBibleTranslations(): Promise<BibleTranslation[]> {
    const response = await apiCall<{ data: BibleTranslation[] }>(
        "/scripture/translations",
        { method: "GET" },
    )

    return response.data
}

export async function getConversationScriptures(
    conversationId: string,
): Promise<ConversationScripture[]> {
    const response = await apiCall<{ data: ConversationScripture[] }>(
        `/conversations/${conversationId}/scriptures`,
        { method: "GET" },
    )

    return response.data
}

export async function attachScripture(
    conversationId: string,
    citation: ScriptureCitationInput,
): Promise<ConversationScripture> {
    return apiCall<ConversationScripture>(
        `/conversations/${conversationId}/scriptures`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ citation }),
        },
    )
}

export async function detachScripture(
    conversationId: string,
    conversationScriptureId: string,
): Promise<void> {
    await apiCall(
        `/conversations/${conversationId}/scriptures/${conversationScriptureId}`,
        {
            method: "DELETE",
        },
    )
}

export async function getScriptureCitation(
    citationId: string,
): Promise<ScriptureCitationDetail> {
    return apiCall<ScriptureCitationDetail>(`/scripture/citations/${citationId}`, {
        method: "GET",
    })
}
