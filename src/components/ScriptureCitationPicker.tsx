import { useEffect, useMemo, useState } from "react"
import * as scriptureApi from "@/api/scripture"
import type {
    BibleTranslation,
    ScriptureBook,
    ScriptureChapter,
    ScriptureCitationInput,
} from "@/types/api"

export type PendingScriptureCitation = ScriptureCitationInput & {
    label: string
}

type ScriptureCitationPickerProps = {
    translations: BibleTranslation[]
    defaultTranslationId: string
    disabled?: boolean
    onAdd: (citation: PendingScriptureCitation) => void
}

function formatCitationLabel(
    bookName: string,
    chapter: number,
    startVerse: number | null,
    endVerse: number | null,
): string {
    if (startVerse === null) return `${bookName} ${chapter}`
    if (endVerse === null || endVerse === startVerse) {
        return `${bookName} ${chapter}:${startVerse}`
    }

    return `${bookName} ${chapter}:${startVerse}-${endVerse}`
}

export function ScriptureCitationPicker({
    translations,
    defaultTranslationId,
    disabled,
    onAdd,
}: ScriptureCitationPickerProps) {
    const [translationId, setTranslationId] = useState(defaultTranslationId)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<ScriptureBook[]>([])
    const [selectedBook, setSelectedBook] = useState<ScriptureBook | null>(null)
    const [chapters, setChapters] = useState<ScriptureChapter[]>([])
    const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
    const [startVerse, setStartVerse] = useState<number | null>(null)
    const [endVerse, setEndVerse] = useState<number | null>(null)
    const [isLoadingBooks, setIsLoadingBooks] = useState(false)
    const [isLoadingChapters, setIsLoadingChapters] = useState(false)

    useEffect(() => {
        setTranslationId(defaultTranslationId)
    }, [defaultTranslationId])

    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }

        let cancelled = false
        setIsLoadingBooks(true)

        scriptureApi
            .searchScriptureBooks(query)
            .then((nextResults) => {
                if (!cancelled) setResults(nextResults.slice(0, 8))
            })
            .catch(() => {
                if (!cancelled) setResults([])
            })
            .finally(() => {
                if (!cancelled) setIsLoadingBooks(false)
            })

        return () => {
            cancelled = true
        }
    }, [query])

    useEffect(() => {
        if (!selectedBook) {
            setChapters([])
            setSelectedChapter(null)
            setStartVerse(null)
            setEndVerse(null)
            return
        }

        let cancelled = false
        setIsLoadingChapters(true)

        scriptureApi
            .listScriptureChapters(selectedBook.id)
            .then((nextChapters) => {
                if (!cancelled) setChapters(nextChapters)
            })
            .catch(() => {
                if (!cancelled) setChapters([])
            })
            .finally(() => {
                if (!cancelled) setIsLoadingChapters(false)
            })

        return () => {
            cancelled = true
        }
    }, [selectedBook])

    const selectedChapterMeta = useMemo(
        () =>
            chapters.find((chapter) => chapter.number === selectedChapter) ??
            null,
        [chapters, selectedChapter],
    )

    const verseOptions = useMemo(() => {
        if (!selectedChapterMeta) return []
        return Array.from(
            { length: selectedChapterMeta.verseCount },
            (_, index) => index + 1,
        )
    }, [selectedChapterMeta])

    const endVerseOptions = useMemo(
        () =>
            startVerse === null
                ? verseOptions
                : verseOptions.filter((verse) => verse >= startVerse),
        [startVerse, verseOptions],
    )

    function resetSelection() {
        setQuery("")
        setResults([])
        setSelectedBook(null)
        setChapters([])
        setSelectedChapter(null)
        setStartVerse(null)
        setEndVerse(null)
    }

    function handleSelectBook(book: ScriptureBook) {
        setSelectedBook(book)
        setQuery(book.name)
        setResults([])
        setSelectedChapter(null)
        setStartVerse(null)
        setEndVerse(null)
    }

    function handleAddCitation() {
        if (!selectedBook || !selectedChapter) return

        onAdd({
            translationId,
            bookId: selectedBook.id,
            startChapter: selectedChapter,
            startVerse,
            endVerse: startVerse === null ? null : endVerse,
            label: formatCitationLabel(
                selectedBook.name,
                selectedChapter,
                startVerse,
                startVerse === null ? null : endVerse,
            ),
        })

        resetSelection()
    }

    return (
        <div className="scripture-picker">
            <div className="split-fields">
                <label className="form-field">
                    <span>Translation</span>
                    <select
                        value={translationId}
                        onChange={(event) =>
                            setTranslationId(event.target.value)
                        }
                        disabled={disabled}
                    >
                        {translations.map((translation) => (
                            <option key={translation.id} value={translation.id}>
                                {translation.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="form-field">
                    <span>Book</span>
                    <input
                        type="text"
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value)
                            setSelectedBook(null)
                            setSelectedChapter(null)
                            setStartVerse(null)
                            setEndVerse(null)
                        }}
                        placeholder="Start typing a book"
                        disabled={disabled}
                    />
                </label>
            </div>

            {(results.length > 0 || isLoadingBooks) && (
                <div className="picker-results">
                    {isLoadingBooks ? (
                        <div className="picker-result muted">Searching books…</div>
                    ) : (
                        results.map((book) => (
                            <button
                                key={book.id}
                                type="button"
                                className="picker-result"
                                onClick={() => handleSelectBook(book)}
                                disabled={disabled}
                            >
                                {book.name}
                            </button>
                        ))
                    )}
                </div>
            )}

            {selectedBook && (
                <>
                    <div className="split-fields">
                        <label className="form-field">
                            <span>Chapter</span>
                            <select
                                value={selectedChapter ?? ""}
                                onChange={(event) => {
                                    const nextChapter = Number(
                                        event.target.value,
                                    )
                                    setSelectedChapter(
                                        Number.isNaN(nextChapter)
                                            ? null
                                            : nextChapter,
                                    )
                                    setStartVerse(null)
                                    setEndVerse(null)
                                }}
                                disabled={disabled || isLoadingChapters}
                            >
                                <option value="">Select chapter</option>
                                {chapters.map((chapter) => (
                                    <option
                                        key={chapter.number}
                                        value={chapter.number}
                                    >
                                        {chapter.number}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="form-field">
                            <span>Start verse</span>
                            <select
                                value={startVerse ?? ""}
                                onChange={(event) => {
                                    const nextValue = event.target.value
                                    const nextVerse = nextValue
                                        ? Number(nextValue)
                                        : null
                                    setStartVerse(nextVerse)
                                    setEndVerse(null)
                                }}
                                disabled={disabled || !selectedChapterMeta}
                            >
                                <option value="">Whole chapter</option>
                                {verseOptions.map((verse) => (
                                    <option key={verse} value={verse}>
                                        {verse}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <label className="form-field">
                        <span>End verse</span>
                        <select
                            value={endVerse ?? ""}
                            onChange={(event) =>
                                setEndVerse(
                                    event.target.value
                                        ? Number(event.target.value)
                                        : null,
                                )
                            }
                            disabled={disabled || startVerse === null}
                        >
                            <option value="">Single verse</option>
                            {endVerseOptions.map((verse) => (
                                <option key={verse} value={verse}>
                                    {verse}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="action-row">
                        <button
                            type="button"
                            onClick={handleAddCitation}
                            disabled={disabled || !selectedChapter}
                        >
                            Add scripture
                        </button>
                        <span className="status-copy">
                            {selectedBook.name}
                        </span>
                    </div>
                </>
            )}
        </div>
    )
}
