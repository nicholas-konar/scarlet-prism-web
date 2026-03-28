import { useEffect, useMemo, useRef, useState } from "react"
import type { BibleTranslation, ScriptureCitationInput } from "@/types/api"
import {
    getScriptureBookName,
    getScriptureChapterOptions,
    getScriptureVerseOptions,
    SCRIPTURE_BOOK_OPTIONS,
} from "@/lib/scripture"
import { PANEL_ACTION_BUTTON_CLASS } from "./buttonClassNames"

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

type ValidationField = "book" | "chapter" | "startVerse" | "endVerse"

type ValidationState = {
    field: ValidationField
    message: string
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
    const bookSelectRef = useRef<HTMLSelectElement>(null)
    const chapterSelectRef = useRef<HTMLSelectElement>(null)
    const startVerseSelectRef = useRef<HTMLSelectElement>(null)
    const endVerseSelectRef = useRef<HTMLSelectElement>(null)
    const [translationId, setTranslationId] = useState(defaultTranslationId)
    const [bookId, setBookId] = useState("")
    const [chapterInput, setChapterInput] = useState("")
    const [startVerseInput, setStartVerseInput] = useState("")
    const [endVerseInput, setEndVerseInput] = useState("")
    const [validation, setValidation] = useState<ValidationState | null>(null)

    useEffect(() => {
        setTranslationId(defaultTranslationId)
    }, [defaultTranslationId])

    useEffect(() => {
        if (!validation) return

        const fieldRefs = {
            book: bookSelectRef,
            chapter: chapterSelectRef,
            startVerse: startVerseSelectRef,
            endVerse: endVerseSelectRef,
        }

        fieldRefs[validation.field].current?.focus()
    }, [validation])

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
        setValidation(null)
    }

    function clearValidation() {
        setValidation(null)
    }

    function applyValidation(field: ValidationField, message: string) {
        setValidation({ field, message })
    }

    function handleAddCitation() {
        if (!bookId) {
            applyValidation("book", "Select a book and enter a chapter.")
            return
        }

        if (chapter === null) {
            applyValidation("chapter", "Select a book and enter a chapter.")
            return
        }

        if (startVerse === null && endVerse !== null) {
            applyValidation(
                "startVerse",
                "Choose a start verse before adding an end verse.",
            )
            return
        }

        if (startVerse !== null && endVerse !== null && endVerse < startVerse) {
            applyValidation(
                "endVerse",
                "End verse must be greater than or equal to the start verse.",
            )
            return
        }

        clearValidation()

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
                        ref={bookSelectRef}
                        value={bookId}
                        onChange={(event) => {
                            setBookId(event.target.value)
                            setChapterInput("")
                            setStartVerseInput("")
                            setEndVerseInput("")
                            clearValidation()
                        }}
                        aria-invalid={validation?.field === "book"}
                        aria-describedby={validation ? "scripture-picker-validation" : undefined}
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
                        ref={chapterSelectRef}
                        value={chapterInput}
                        onChange={(event) => {
                            setChapterInput(event.target.value)
                            setStartVerseInput("")
                            setEndVerseInput("")
                            clearValidation()
                        }}
                        aria-invalid={validation?.field === "chapter"}
                        aria-describedby={validation ? "scripture-picker-validation" : undefined}
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
                        ref={startVerseSelectRef}
                        value={startVerseInput}
                        onChange={(event) => {
                            setStartVerseInput(event.target.value)
                            if (!event.target.value) {
                                setEndVerseInput("")
                            }
                            clearValidation()
                        }}
                        aria-invalid={validation?.field === "startVerse"}
                        aria-describedby={validation ? "scripture-picker-validation" : undefined}
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
                        ref={endVerseSelectRef}
                        value={endVerseInput}
                        onChange={(event) => {
                            setEndVerseInput(event.target.value)
                            clearValidation()
                        }}
                        aria-invalid={validation?.field === "endVerse"}
                        aria-describedby={validation ? "scripture-picker-validation" : undefined}
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
                    className={PANEL_ACTION_BUTTON_CLASS}
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

            {validation && (
                <p
                    id="scripture-picker-validation"
                    className="meta-copy"
                    role="status"
                    aria-live="polite"
                >
                    {validation.message}
                </p>
            )}
        </div>
    )
}
