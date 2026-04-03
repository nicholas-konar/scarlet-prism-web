import * as conversationsApi from "@/api/conversations"
import * as sermonsApi from "@/api/sermons"
import * as scriptureApi from "@/api/scripture"
import type {
    BibleTranslation,
    Conversation,
    ConversationRequest,
    ConversationScripture,
    ConversationSermon,
    Message,
    PaginatedResponse,
    ScriptureCitationInput,
    Sermon,
} from "@/types/api"

// Keep the conversations workspace on a single front-end API contract so
// backend endpoint changes only need to be reconciled in one place.
export type ConversationWorkspaceResources = {
    messages: Message[]
    sermons: ConversationSermon[]
    scriptures: ConversationScripture[]
}

export interface ConversationWorkspaceApi {
    listConversations: (
        limit?: number,
        cursor?: string,
    ) => Promise<PaginatedResponse<Conversation>>
    getConversationMessages: (
        conversationId: string,
        limit?: number,
        cursor?: string,
    ) => Promise<PaginatedResponse<Message>>
    streamConversation: (
        data: ConversationRequest,
        onChunk: (chunk: string) => void,
    ) => Promise<void>
    listSermons: (congregationId: string) => Promise<PaginatedResponse<Sermon>>
    listBibleTranslations: () => Promise<BibleTranslation[]>
    getConversationSermons: (
        conversationId: string,
    ) => Promise<ConversationSermon[]>
    getConversationScriptures: (
        conversationId: string,
    ) => Promise<ConversationScripture[]>
    loadConversationResources: (
        conversationId: string,
    ) => Promise<ConversationWorkspaceResources>
    attachSermon: (
        conversationId: string,
        sermonId: string,
    ) => Promise<ConversationSermon>
    detachSermon: (
        conversationId: string,
        conversationSermonId: string,
    ) => Promise<void>
    attachScripture: (
        conversationId: string,
        citation: ScriptureCitationInput,
    ) => Promise<ConversationScripture>
    detachScripture: (
        conversationId: string,
        conversationScriptureId: string,
    ) => Promise<void>
}

export const conversationWorkspaceApi: ConversationWorkspaceApi = {
    listConversations: conversationsApi.listConversations,
    getConversationMessages: conversationsApi.getConversationMessages,
    streamConversation: conversationsApi.streamConversation,
    listSermons: sermonsApi.listSermons,
    listBibleTranslations: scriptureApi.listBibleTranslations,
    getConversationSermons: sermonsApi.getConversationSermons,
    getConversationScriptures: scriptureApi.getConversationScriptures,
    async loadConversationResources(conversationId) {
        const [messagesResponse, sermons, scriptures] = await Promise.all([
            conversationsApi.getConversationMessages(conversationId),
            sermonsApi.getConversationSermons(conversationId),
            scriptureApi.getConversationScriptures(conversationId),
        ])

        return {
            messages: [...messagesResponse.data].reverse(),
            sermons,
            scriptures,
        }
    },
    attachSermon: sermonsApi.attachSermon,
    detachSermon: sermonsApi.detachSermon,
    attachScripture: scriptureApi.attachScripture,
    detachScripture: scriptureApi.detachScripture,
}
