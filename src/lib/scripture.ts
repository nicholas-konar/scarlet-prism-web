import { SCRIPTURE_VERSE_COUNTS } from "./scriptureMetadata"

export const SYSTEM_DEFAULT_BIBLE_TRANSLATION_ID = "esv"

export type ScriptureBookOption = {
    id: string
    name: string
}

export const SCRIPTURE_BOOK_OPTIONS: ScriptureBookOption[] = [
    { id: "Gen", name: "Genesis" },
    { id: "Exod", name: "Exodus" },
    { id: "Lev", name: "Leviticus" },
    { id: "Num", name: "Numbers" },
    { id: "Deut", name: "Deuteronomy" },
    { id: "Josh", name: "Joshua" },
    { id: "Judg", name: "Judges" },
    { id: "Ruth", name: "Ruth" },
    { id: "1Sam", name: "1 Samuel" },
    { id: "2Sam", name: "2 Samuel" },
    { id: "1Kgs", name: "1 Kings" },
    { id: "2Kgs", name: "2 Kings" },
    { id: "1Chr", name: "1 Chronicles" },
    { id: "2Chr", name: "2 Chronicles" },
    { id: "Ezra", name: "Ezra" },
    { id: "Neh", name: "Nehemiah" },
    { id: "Esth", name: "Esther" },
    { id: "Job", name: "Job" },
    { id: "Ps", name: "Psalms" },
    { id: "Prov", name: "Proverbs" },
    { id: "Eccl", name: "Ecclesiastes" },
    { id: "Song", name: "Song of Solomon" },
    { id: "Isa", name: "Isaiah" },
    { id: "Jer", name: "Jeremiah" },
    { id: "Lam", name: "Lamentations" },
    { id: "Ezek", name: "Ezekiel" },
    { id: "Dan", name: "Daniel" },
    { id: "Hos", name: "Hosea" },
    { id: "Joel", name: "Joel" },
    { id: "Amos", name: "Amos" },
    { id: "Obad", name: "Obadiah" },
    { id: "Jonah", name: "Jonah" },
    { id: "Mic", name: "Micah" },
    { id: "Nah", name: "Nahum" },
    { id: "Hab", name: "Habakkuk" },
    { id: "Zeph", name: "Zephaniah" },
    { id: "Hag", name: "Haggai" },
    { id: "Zech", name: "Zechariah" },
    { id: "Mal", name: "Malachi" },
    { id: "Matt", name: "Matthew" },
    { id: "Mark", name: "Mark" },
    { id: "Luke", name: "Luke" },
    { id: "John", name: "John" },
    { id: "Acts", name: "Acts" },
    { id: "Rom", name: "Romans" },
    { id: "1Cor", name: "1 Corinthians" },
    { id: "2Cor", name: "2 Corinthians" },
    { id: "Gal", name: "Galatians" },
    { id: "Eph", name: "Ephesians" },
    { id: "Phil", name: "Philippians" },
    { id: "Col", name: "Colossians" },
    { id: "1Thess", name: "1 Thessalonians" },
    { id: "2Thess", name: "2 Thessalonians" },
    { id: "1Tim", name: "1 Timothy" },
    { id: "2Tim", name: "2 Timothy" },
    { id: "Titus", name: "Titus" },
    { id: "Phlm", name: "Philemon" },
    { id: "Heb", name: "Hebrews" },
    { id: "Jas", name: "James" },
    { id: "1Pet", name: "1 Peter" },
    { id: "2Pet", name: "2 Peter" },
    { id: "1John", name: "1 John" },
    { id: "2John", name: "2 John" },
    { id: "3John", name: "3 John" },
    { id: "Jude", name: "Jude" },
    { id: "Rev", name: "Revelation" },
]

const scriptureBookNames = new Map(
    SCRIPTURE_BOOK_OPTIONS.map((book) => [book.id, book.name]),
)

export function getScriptureBookName(bookId: string): string {
    return scriptureBookNames.get(bookId) ?? bookId
}

export function getScriptureChapterOptions(bookId: string): number[] {
    const verseCounts = SCRIPTURE_VERSE_COUNTS[bookId]
    if (!verseCounts) return []

    return verseCounts.map((_, index) => index + 1)
}

export function getScriptureVerseOptions(
    bookId: string,
    chapter: number,
): number[] {
    const verseCount = SCRIPTURE_VERSE_COUNTS[bookId]?.[chapter - 1]
    if (!verseCount) return []

    return Array.from({ length: verseCount }, (_, index) => index + 1)
}

export function getEffectiveBibleTranslationId(args: {
    userDefaultBibleTranslationId?: string | null
    congregationDefaultBibleTranslationId?: string | null
}): string {
    return (
        args.userDefaultBibleTranslationId ??
        args.congregationDefaultBibleTranslationId ??
        SYSTEM_DEFAULT_BIBLE_TRANSLATION_ID
    )
}
