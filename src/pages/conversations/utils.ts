import type { PendingScriptureCitation } from "@/components/ScriptureCitationPicker"
import type {
    BibleTranslation,
    ConversationEvent,
    ConversationSermon,
    ConversationScripture,
    ScriptureCitation,
    ScriptureCitationInput,
    Sermon,
} from "@/types/api"
import type {
    HistoryScriptureItem,
    HistorySectionButton,
    LibraryScriptureItem,
    LibrarySermonItem,
} from "./models"

type LibraryCitation = Pick<
    ScriptureCitation,
    | "translationId"
    | "bookId"
    | "startChapter"
    | "startVerse"
    | "endVerse"
    | "label"
    | "contentStatus"
    | "contentText"
>

type LibraryCitationEntry = {
    label: string
    sources: Set<string>
    userScriptureIds: string[]
    translationId: string
    translationLabel: string
    translationName: string
    translationEdition?: string | null
    contentStatus: LibraryScriptureItem["contentStatus"]
    contentText?: string | null
}

export function formatSermonDate(value: string | null): string | null {
    if (!value?.trim()) return null

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    const parts = new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    }).formatToParts(date)

    const weekday = parts.find((part) => part.type === "weekday")?.value
    const month = parts.find((part) => part.type === "month")?.value
    const day = parts.find((part) => part.type === "day")?.value
    const year = parts.find((part) => part.type === "year")?.value

    if (!weekday || !month || !day || !year) {
        return value
    }

    return `${weekday} ${month} ${day}, ${year}`
}

export function getCitationKey(
    citation: Pick<
        ScriptureCitationInput,
        "translationId" | "bookId" | "startChapter" | "startVerse" | "endVerse"
    >,
): string {
    return [
        citation.translationId ?? "*",
        citation.bookId,
        citation.startChapter,
        citation.startVerse ?? "*",
        citation.endVerse ?? "*",
    ].join(":")
}

export function getSermonDisplay(
    sermon: Sermon | null | undefined,
    fallbackLabel: string,
) {
    return {
        label: sermon?.title ?? fallbackLabel,
        recordedOn: formatSermonDate(sermon?.recordedOn ?? null),
        speaker: sermon?.speaker ?? null,
    }
}

export function createConversationEvent(
    prefix: string,
    text: string,
): ConversationEvent {
    return {
        id: `${prefix}-${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
    }
}

export function buildPendingScripturePayload(
    citations: PendingScriptureCitation[],
): ScriptureCitationInput[] {
    return citations.map(
        ({ translationId, bookId, startChapter, startVerse, endVerse }) => ({
            translationId,
            bookId,
            startChapter,
            startVerse,
            endVerse,
        }),
    )
}

function getTranslationDisplay(
    translationId: string | null | undefined,
    translations: BibleTranslation[],
) {
    const fallbackId = translationId?.trim() || "unknown"
    const match = translations.find((item) => item.id === fallbackId)

    return {
        translationLabel:
            match?.abbreviation?.trim() || fallbackId.toUpperCase(),
        translationName: match?.name || fallbackId.toUpperCase(),
        translationEdition: match?.edition ?? null,
    }
}

function getCitationContentStatus(
    citation: Partial<Pick<ScriptureCitation, "contentStatus" | "contentText">> | null,
): LibraryScriptureItem["contentStatus"] {
    if (citation?.contentText?.trim()) {
        return "ready"
    }

    return citation?.contentStatus ?? "unavailable"
}

function getContentPriority(status: LibraryScriptureItem["contentStatus"]): number {
    switch (status) {
        case "ready":
            return 4
        case "hydrating":
            return 3
        case "pending":
            return 2
        case "failed":
            return 1
        default:
            return 0
    }
}

function addLibraryCitation(
    items: Map<string, LibraryCitationEntry>,
    citation: LibraryCitation,
    source: string,
    translations: BibleTranslation[],
    userScriptureId?: string,
) {
    const key = getCitationKey(citation)
    const existing = items.get(key)
    const translationDisplay = getTranslationDisplay(
        citation.translationId,
        translations,
    )
    const nextStatus = getCitationContentStatus(citation)
    const nextContent = citation.contentText?.trim() || null

    if (existing) {
        existing.sources.add(source)
        if (userScriptureId) {
            existing.userScriptureIds.push(userScriptureId)
        }
        if (getContentPriority(nextStatus) > getContentPriority(existing.contentStatus)) {
            existing.contentStatus = nextStatus
            existing.contentText = nextContent
        }
        return
    }

    items.set(key, {
        label: citation.label,
        sources: new Set([source]),
        userScriptureIds: userScriptureId ? [userScriptureId] : [],
        translationId: citation.translationId,
        translationLabel: translationDisplay.translationLabel,
        translationName: translationDisplay.translationName,
        translationEdition: translationDisplay.translationEdition,
        contentStatus: nextStatus,
        contentText: nextContent,
    })
}

export function buildLibraryScriptureItems({
    effectiveConversationId,
    activeScriptures,
    pendingUserScriptures,
    pendingSermonIds,
    sermons,
    translations,
    onDetachUserScripture,
}: {
    effectiveConversationId: string | null
    activeScriptures: ConversationScripture[]
    pendingUserScriptures: PendingScriptureCitation[]
    pendingSermonIds: string[]
    sermons: Sermon[]
    translations: BibleTranslation[]
    onDetachUserScripture: (
        scriptureKey: string,
        conversationScriptureId?: string,
    ) => Promise<void>
}): LibraryScriptureItem[] {
    const items = new Map<string, LibraryCitationEntry>()

    if (effectiveConversationId) {
        activeScriptures.forEach((item) => {
            if (!item.citation) return
            addLibraryCitation(
                items,
                item.citation,
                item.sermonId
                    ? item.sermonTitle || "Attached sermon"
                    : "Added directly",
                translations,
                item.sermonId ? undefined : item.id,
            )
        })
    } else {
        pendingUserScriptures.forEach((citation) => {
            addLibraryCitation(
                items,
                citation,
                "Added directly",
                translations,
                getCitationKey(citation),
            )
        })

        pendingSermonIds.forEach((sermonId) => {
            const sermon = sermons.find((item) => item.id === sermonId)
            sermon?.scriptures.forEach((citation) => {
                addLibraryCitation(
                    items,
                    citation,
                    sermon.title,
                    translations,
                )
            })
        })
    }

    return Array.from(items.entries()).map(([key, value]) => ({
        key,
        label: value.label,
        source: Array.from(value.sources).join(" • "),
        sources: Array.from(value.sources),
        translationLabel: value.translationLabel,
        translationName: value.translationName,
        translationEdition: value.translationEdition,
        contentStatus: value.contentStatus,
        contentText: value.contentText,
        onDetach:
            value.userScriptureIds.length > 0
                ? () => {
                      void onDetachUserScripture(
                          key,
                          effectiveConversationId
                              ? value.userScriptureIds[0]
                              : undefined,
                      )
                  }
                : undefined,
    }))
}

export function buildLibrarySermonItems({
    effectiveConversationId,
    activeSermons,
    pendingSermonIds,
    sermons,
    onDetachSermon,
    onTogglePendingSermon,
}: {
    effectiveConversationId: string | null
    activeSermons: ConversationSermon[]
    pendingSermonIds: string[]
    sermons: Sermon[]
    onDetachSermon: (conversationSermonId: string) => Promise<void>
    onTogglePendingSermon: (sermonId: string) => void
}): LibrarySermonItem[] {
    if (effectiveConversationId) {
        return activeSermons.map((item) => {
            const sermon =
                item.sermon ??
                sermons.find((candidate) => candidate.id === item.sermonId)
            const sermonDisplay = getSermonDisplay(sermon, item.sermonId)

            return {
                key: item.id,
                ...sermonDisplay,
                onDetach: () => {
                    void onDetachSermon(item.id)
                },
            }
        })
    }

    return pendingSermonIds.map((sermonId) => {
        const sermon = sermons.find((item) => item.id === sermonId)
        const sermonDisplay = getSermonDisplay(sermon, sermonId)

        return {
            key: sermonId,
            ...sermonDisplay,
            onDetach: () => onTogglePendingSermon(sermonId),
        }
    })
}

export function buildConversationEvents({
    effectiveConversationId,
    allConversationSermons,
    allConversationScriptures,
    sermons,
    pendingEvents,
}: {
    effectiveConversationId: string | null
    allConversationSermons: ConversationSermon[]
    allConversationScriptures: ConversationScripture[]
    sermons: Sermon[]
    pendingEvents: ConversationEvent[]
}): ConversationEvent[] {
    if (!effectiveConversationId) {
        return pendingEvents
    }

    return [
        ...allConversationSermons.flatMap((record) => {
            const title =
                record.sermon?.title ??
                sermons.find((sermon) => sermon.id === record.sermonId)?.title ??
                record.sermonId

            const events: ConversationEvent[] = [
                {
                    id: `attach-${record.id}`,
                    text: `Attached "${title}" to conversation`,
                    createdAt: record.createdAt,
                },
            ]

            if (record.removedAt) {
                events.push({
                    id: `detach-${record.id}`,
                    text: `Removed "${title}" from conversation`,
                    createdAt: record.removedAt,
                })
            }

            return events
        }),
        ...allConversationScriptures.flatMap((item) => {
            const label = item.citation?.label ?? item.scriptureCitationId
            const events: ConversationEvent[] = [
                {
                    id: `scripture-attach-${item.id}`,
                    text: `Attached scripture "${label}" to conversation`,
                    createdAt: item.createdAt,
                },
            ]

            if (item.removedAt) {
                events.push({
                    id: `scripture-detach-${item.id}`,
                    text: `Removed scripture "${label}" from conversation`,
                    createdAt: item.removedAt,
                })
            }

            return events
        }),
    ]
}

export function buildHistoryScriptureItems(
    scriptures: LibraryScriptureItem[],
): HistoryScriptureItem[] {
    return scriptures.map((scripture) => ({
        key: scripture.key,
        label: scripture.label,
        meta: scripture.source,
    }))
}

export function buildHistorySectionButtons({
    conversationsCount,
    sermonsCount,
    scriptureCount,
}: {
    conversationsCount: number
    sermonsCount: number
    scriptureCount: number
}): HistorySectionButton[] {
    return [
        {
            id: "conversations",
            label: "Conversations",
            count: conversationsCount,
        },
        {
            id: "sermons",
            label: "Sermons",
            count: sermonsCount,
        },
        {
            id: "scripture",
            label: "Scripture",
            count: scriptureCount,
        },
    ]
}
