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

const DIRECT_SCRIPTURE_SOURCE = "Added directly"
const ATTACHED_SERMON_SOURCE = "Attached sermon"

const LIBRARY_SCRIPTURE_STATUS = {
    ready: ["Ready to read", "", 4, false],
    hydrating: ["Preparing text", "The passage is being hydrated from the scripture provider and should appear here shortly.", 3, true],
    pending: ["Queued for fetch", "This reference is attached, but the passage text has not been fetched yet.", 2, true],
    failed: ["Needs refresh", "The reference is attached, but the passage text could not be loaded from the provider.", 1, false],
    unavailable: ["Reference only", "This reference is attached, but passage text is not available in the current session.", 0, false],
} satisfies Record<
    LibraryScriptureItem["contentStatus"],
    readonly [label: string, placeholder: string, priority: number, isPending: boolean]
>

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

export function getLibraryScriptureStatus(
    status: LibraryScriptureItem["contentStatus"],
) {
    const [label, placeholder, priority, isPending] =
        LIBRARY_SCRIPTURE_STATUS[status]
    return { label, placeholder, priority, isPending }
}

function buildSermonLookup(sermons: Sermon[]) {
    return new Map(sermons.map((sermon) => [sermon.id, sermon]))
}

function getCitationContentStatus(
    citation: Partial<Pick<ScriptureCitation, "contentStatus" | "contentText">> | null,
): LibraryScriptureItem["contentStatus"] {
    if (citation?.contentText?.trim()) {
        return "ready"
    }

    return citation?.contentStatus ?? "unavailable"
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
        if (
            getLibraryScriptureStatus(nextStatus).priority >
            getLibraryScriptureStatus(existing.contentStatus).priority
        ) {
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

function buildAttachmentEvents(
    idPrefix: string,
    textLabel: string,
    createdAt: string,
    removedAt?: string | null,
) {
    const attachedEvent: ConversationEvent = {
        id: `${idPrefix}-attach`,
        text: `Attached ${textLabel} to conversation`,
        createdAt,
    }

    return removedAt
        ? [
              attachedEvent,
              {
                  id: `${idPrefix}-detach`,
                  text: `Removed ${textLabel} from conversation`,
                  createdAt: removedAt,
              },
          ]
        : [attachedEvent]
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
    const sermonLookup = buildSermonLookup(sermons)

    if (effectiveConversationId) {
        activeScriptures.forEach((item) => {
            if (!item.citation) return
            addLibraryCitation(
                items,
                item.citation,
                item.sermonId
                    ? item.sermonTitle || ATTACHED_SERMON_SOURCE
                    : DIRECT_SCRIPTURE_SOURCE,
                translations,
                item.sermonId ? undefined : item.id,
            )
        })
    } else {
        pendingUserScriptures.forEach((citation) => {
            addLibraryCitation(
                items,
                citation,
                DIRECT_SCRIPTURE_SOURCE,
                translations,
                getCitationKey(citation),
            )
        })

        pendingSermonIds.forEach((sermonId) => {
            const sermon = sermonLookup.get(sermonId)
            sermon?.scriptures.forEach((citation) => {
                addLibraryCitation(items, citation, sermon.title, translations)
            })
        })
    }

    return Array.from(items.entries()).map(([key, value]) => {
        const sources = Array.from(value.sources)

        return {
            key,
            label: value.label,
            source: sources.join(" • "),
            sources,
            translationLabel: value.translationLabel,
            translationName: value.translationName,
            translationEdition: value.translationEdition,
            contentStatus: value.contentStatus,
            contentText: value.contentText,
            onDetach:
                value.userScriptureIds.length === 0
                    ? undefined
                    : () => {
                          void onDetachUserScripture(
                              key,
                              effectiveConversationId
                                  ? value.userScriptureIds[0]
                                  : undefined,
                          )
                      },
        }
    })
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
    const sermonLookup = buildSermonLookup(sermons)

    if (effectiveConversationId) {
        return activeSermons.map((item) => {
            const sermon =
                item.sermon ?? sermonLookup.get(item.sermonId)
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
        const sermon = sermonLookup.get(sermonId)
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

    const sermonLookup = buildSermonLookup(sermons)

    return [
        ...allConversationSermons.flatMap((record) => {
            const title =
                record.sermon?.title ??
                sermonLookup.get(record.sermonId)?.title ??
                record.sermonId
            return buildAttachmentEvents(
                record.id,
                `"${title}"`,
                record.createdAt,
                record.removedAt,
            )
        }),
        ...allConversationScriptures.flatMap((item) => {
            const label = item.citation?.label ?? item.scriptureCitationId
            return buildAttachmentEvents(
                `scripture-${item.id}`,
                `scripture "${label}"`,
                item.createdAt,
                item.removedAt,
            )
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
