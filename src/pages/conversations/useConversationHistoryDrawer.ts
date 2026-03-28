import { useCallback, useEffect, useState } from "react"
import type { HistorySection } from "./models"

export function useConversationHistoryDrawer(
    initialSection: HistorySection = "sermons",
) {
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [activeHistorySection, setActiveHistorySection] =
        useState<HistorySection>(initialSection)

    const closeHistory = useCallback(() => {
        setIsHistoryOpen(false)
    }, [])

    const openHistory = useCallback((section?: HistorySection) => {
        if (section) {
            setActiveHistorySection(section)
        }
        setIsHistoryOpen(true)
    }, [])

    useEffect(() => {
        if (!isHistoryOpen) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeHistory()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [closeHistory, isHistoryOpen])

    return {
        isHistoryOpen,
        activeHistorySection,
        setActiveHistorySection,
        openHistory,
        closeHistory,
    }
}
