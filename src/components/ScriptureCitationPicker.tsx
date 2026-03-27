import { useEffect, useMemo, useState } from "react"
import type { BibleTranslation, ScriptureCitationInput } from "@/types/api"
import {
    getScriptureBookName,
    getScriptureChapterOptions,
    getScriptureVerseOptions,
    SCRIPTURE_BOOK_OPTIONS,
} from "@/lib/scripture"

export type PendingScriptureCitation = Omit<
    ScriptureCitationInput,
    "translationId"
> & {
    translationId: string
    label: string
}

type ScriptureCitationPickerProps = {
    translations: BibleTranslation[]
    defaultTranslationId: string
    disabled?: boolean
    onAdd: (citation: PendingScriptureCitation) => void
}

function formatCitationLabel(
    bookId: string,
    chapter: number,
    startVerse: number | null,
    endVerse: number | null,
): string {
    const bookName = getScriptureBookName(bookId)

    if (startVerse === null) return `${bookName} ${chapter}`
    if (endVerse === null || endVerse === startVerse) {
        return `${bookName} ${chapter}:${startVerse}`
    }

    return `${bookName} ${chapter}:${startVerse}-${endVerse}`
}

function parsePositiveNumber(value: string): number | null {
    if (!value.trim()) return null

    const parsed = Number(value)

    if (!Number.isInteger(parsed) || parsed < 1) {
        return null
    }

    return parsed
}

export function ScriptureCitationPicker({
    translations,
    defaultTranslationId,
    disabled,
    onAdd,
}: ScriptureCitationPickerProps) {
    const [translationId, setTranslationId] = useState(defaultTranslationId)
    const [bookId, setBookId] = useState("")
    const [chapterInput, setChapterInput] = useState("")
    const [startVerseInput, setStartVerseInput] = useState("")
    const [endVerseInput, setEndVerseInput] = useState("")
    const [validationMessage, setValidationMessage] = useState<string | null>(null)

    useEffect(() => {
        setTranslationId(defaultTranslationId)
    }, [defaultTranslationId])

    const chapter = useMemo(
        () => parsePositiveNumber(chapterInput),
        [chapterInput],
    )
    const startVerse = useMemo(
        () => parsePositiveNumber(startVerseInput),
        [startVerseInput],
    )
    const endVerse = useMemo(
        () => parsePositiveNumber(endVerseInput),
        [endVerseInput],
    )
    const chapterOptions = useMemo(
        () => (bookId ? getScriptureChapterOptions(bookId) : []),
        [bookId],
    )
    const verseOptions = useMemo(
        () => (bookId && chapter ? getScriptureVerseOptions(bookId, chapter) : []),
        [bookId, chapter],
    )
    const endVerseOptions = useMemo(() => {
        if (!startVerse) return verseOptions
        return verseOptions.filter((verse) => verse >= startVerse)
    }, [startVerse, verseOptions])

    function resetSelection() {
        setBookId("")
        setChapterInput("")
        setStartVerseInput("")
        setEndVerseInput("")
        setValidationMessage(null)
    }

    function handleAddCitation() {
        if (!bookId || chapter === null) {
            setValidationMessage("Select a book and enter a chapter.")
            return
        }

        if (startVerse === null && endVerse !== null) {
            setValidationMessage(
                "Choose a start verse before adding an end verse.",
            )
            return
        }

        if (startVerse !== null && endVerse !== null && endVerse < startVerse) {
            setValidationMessage(
                "End verse must be greater than or equal to the start verse.",
            )
            return
        }

        setValidationMessage(null)

        onAdd({
            translationId,
            bookId,
            startChapter: chapter,
            startVerse,
            endVerse,
            label: formatCitationLabel(bookId, chapter, startVerse, endVerse),
        })

        resetSelection()
    }

    return (
        <div className="scripture-picker">
            <div className="scripture-picker-row scripture-picker-row--book">
                <label className="form-field">
                    <span>Book</span>
                    <select
                        value={bookId}
                        onChange={(event) => {
                            setBookId(event.target.value)
                            setChapterInput("")
                            setStartVerseInput("")
                            setEndVerseInput("")
                            setValidationMessage(null)
                        }}
                        disabled={disabled}
                    >
                        <option value="">Select book</option>
                        {SCRIPTURE_BOOK_OPTIONS.map((book) => (
                            <option key={book.id} value={book.id}>
                                {book.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="form-field">
                    <span>Chapter</span>
                    <select
                        value={chapterInput}
                        onChange={(event) => {
                            setChapterInput(event.target.value)
                            setStartVerseInput("")
                            setEndVerseInput("")
                            setValidationMessage(null)
                        }}
                        disabled={disabled || !bookId}
                    >
                        <option value="">Select chapter</option>
                        {chapterOptions.map((chapterOption) => (
                            <option key={chapterOption} value={chapterOption}>
                                {chapterOption}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="scripture-picker-row scripture-picker-row--verses">
                <label className="form-field">
                    <span>Start verse</span>
                    <select
                        value={startVerseInput}
                        onChange={(event) => {
                            setStartVerseInput(event.target.value)
                            if (!event.target.value) {
                                setEndVerseInput("")
                            }
                            setValidationMessage(null)
                        }}
                        disabled={disabled || !chapter}
                    >
                        <option value="">Optional</option>
                        {verseOptions.map((verseOption) => (
                            <option key={verseOption} value={verseOption}>
                                {verseOption}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="form-field">
                    <span>End verse</span>
                    <select
                        value={endVerseInput}
                        onChange={(event) => {
                            setEndVerseInput(event.target.value)
                            setValidationMessage(null)
                        }}
                        disabled={disabled || !startVerseInput}
                    >
                        <option value="">Optional</option>
                        {endVerseOptions.map((verseOption) => (
                            <option key={verseOption} value={verseOption}>
                                {verseOption}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <label className="form-field">
                <span>Translation</span>
                <select
                    value={translationId}
                    onChange={(event) => setTranslationId(event.target.value)}
                    disabled={disabled}
                >
                    {translations.map((translation) => (
                        <option key={translation.id} value={translation.id}>
                            {translation.name}
                        </option>
                    ))}
                </select>
            </label>

            <div className="action-row">
                <button
                    type="button"
                    className="ui-button ui-button--caps ui-button--compact ui-button--subtle ui-button--hover-tint ui-button--press"
                    onClick={handleAddCitation}
                    disabled={disabled}
                >
                    Add scripture
                </button>
                {(bookId || chapter !== null) && (
                    <span className="status-copy">
                        {formatCitationLabel(bookId || "Scripture", chapter ?? 0, startVerse, endVerse)}
                    </span>
                )}
            </div>

            {validationMessage && (
                <p className="meta-copy">{validationMessage}</p>
            )}
        </div>
    )
}
