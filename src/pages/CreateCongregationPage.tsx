import { FormEvent, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import * as congregationsApi from "@/api/congregations"
import * as scriptureApi from "@/api/scripture"
import { SiteHeader } from "@/components/SiteHeader"
import { useAuth } from "@/context/AuthContext"
import type { BibleTranslation } from "@/types/api"

export function CreateCongregationPage() {
    const navigate = useNavigate()
    const { currentCongregation, refreshUser } = useAuth()
    const [name, setName] = useState("")
    const [denomination, setDenomination] = useState("")
    const [location, setLocation] = useState("")
    const [website, setWebsite] = useState("")
    const [about, setAbout] = useState("")
    const [translations, setTranslations] = useState<BibleTranslation[]>([])
    const [defaultBibleTranslationId, setDefaultBibleTranslationId] = useState("")
    const [error, setError] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        scriptureApi
            .listBibleTranslations()
            .then(setTranslations)
            .catch(() => setTranslations([]))
    }, [])

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        setError("")
        setIsSaving(true)

        try {
            await congregationsApi.createCongregation({
                name,
                denomination: denomination || null,
                location: location || null,
                website: website || null,
                about: about || null,
                defaultBibleTranslationId: defaultBibleTranslationId || null,
            })
            await refreshUser()
            navigate("/admin/congregation", { replace: true })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create congregation")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="app-page">
            <SiteHeader
                title="Register your church"
                links={[{ label: "Home", to: "/" }]}
            />

            <main className="app-content">
                <section className="panel form-panel">
                    <p className="panel-copy">
                        This path is intended for pastors and staff. Creating a congregation will make it your current congregation in the app.
                    </p>
                    {currentCongregation && (
                        <div className="inline-note">
                            Your current congregation is <strong>{currentCongregation.name}</strong>. Creating another congregation will switch your active congregation to the new one.
                        </div>
                    )}

                    <form className="stack-form" onSubmit={handleSubmit}>
                        <label className="form-field">
                            <span>Name</span>
                            <input
                                type="text"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Grace Community Church"
                                disabled={isSaving}
                                required
                            />
                        </label>

                        <label className="form-field">
                            <span>Denomination</span>
                            <input
                                type="text"
                                value={denomination}
                                onChange={(event) => setDenomination(event.target.value)}
                                placeholder="Non-denominational"
                                disabled={isSaving}
                            />
                        </label>

                        <label className="form-field">
                            <span>Location</span>
                            <input
                                type="text"
                                value={location}
                                onChange={(event) => setLocation(event.target.value)}
                                placeholder="Austin, TX"
                                disabled={isSaving}
                            />
                        </label>

                        <label className="form-field">
                            <span>Website</span>
                            <input
                                type="url"
                                value={website}
                                onChange={(event) => setWebsite(event.target.value)}
                                placeholder="https://example.org"
                                disabled={isSaving}
                            />
                        </label>

                        <label className="form-field">
                            <span>Default Bible translation</span>
                            <select
                                value={defaultBibleTranslationId}
                                onChange={(event) =>
                                    setDefaultBibleTranslationId(event.target.value)
                                }
                                disabled={isSaving}
                            >
                                <option value="">Use system default</option>
                                {translations.map((translation) => (
                                    <option key={translation.id} value={translation.id}>
                                        {translation.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="form-field">
                            <span>About</span>
                            <textarea
                                value={about}
                                onChange={(event) => setAbout(event.target.value)}
                                placeholder="Short description for the congregation profile."
                                rows={5}
                                disabled={isSaving}
                            />
                        </label>

                        {error && <div className="error-message">{error}</div>}

                        <div className="action-row">
                            <button type="submit" disabled={isSaving}>
                                {isSaving ? "Creating..." : "Create congregation"}
                            </button>
                            <Link to="/">Cancel</Link>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    )
}
