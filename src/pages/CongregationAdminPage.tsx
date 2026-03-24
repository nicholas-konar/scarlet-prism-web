import { FormEvent, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import * as congregationsApi from "@/api/congregations"
import * as sermonsApi from "@/api/sermons"
import * as scriptureApi from "@/api/scripture"
import { ScriptureCitationPicker, type PendingScriptureCitation } from "@/components/ScriptureCitationPicker"
import { SiteHeader } from "@/components/SiteHeader"
import { useAuth } from "@/context/AuthContext"
import { membershipHasPermission } from "@/lib/congregationPermissions"
import type {
    BibleTranslation,
    CongregationMembership,
    CongregationPermission,
    Sermon,
} from "@/types/api"

const MANAGEABLE_PERMISSIONS: CongregationPermission[] = [
    "super_admin",
    "edit_profile",
    "manage_members",
    "manage_sermons",
]

function formatDate(value: string | null): string {
    if (!value) return "No date"
    return new Date(value).toLocaleDateString()
}

function formatScriptures(
    scriptures: PendingScriptureCitation[] | Sermon["scriptures"],
): string {
    if (scriptures.length === 0) return "No scripture references"
    return scriptures
        .map(
            (scripture) =>
                `${scripture.label} (${scripture.translationId.toUpperCase()})`,
        )
        .join(", ")
}

export function CongregationAdminPage() {
    const { user, currentCongregation, refreshUser } = useAuth()
    const congregationId = currentCongregation?.id ?? null
    const [profileForm, setProfileForm] = useState({
        name: "",
        denomination: "",
        location: "",
        website: "",
        about: "",
        defaultBibleTranslationId: "",
    })
    const [translations, setTranslations] = useState<BibleTranslation[]>([])
    const [members, setMembers] = useState<CongregationMembership[]>([])
    const [sermons, setSermons] = useState<Sermon[]>([])
    const [selectedAudio, setSelectedAudio] = useState<File | null>(null)
    const [sermonTitle, setSermonTitle] = useState("")
    const [sermonSpeaker, setSermonSpeaker] = useState("")
    const [sermonRecordedOn, setSermonRecordedOn] = useState("")
    const [sermonScriptures, setSermonScriptures] = useState<
        PendingScriptureCitation[]
    >([])
    const [pageError, setPageError] = useState<string | null>(null)
    const [profileMessage, setProfileMessage] = useState<string | null>(null)
    const [sermonMessage, setSermonMessage] = useState<string | null>(null)
    const [memberMessage, setMemberMessage] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [isUploadingSermon, setIsUploadingSermon] = useState(false)
    const [busyPermissionKey, setBusyPermissionKey] = useState<string | null>(null)

    useEffect(() => {
        if (!currentCongregation) return

        setProfileForm({
            name: currentCongregation.name,
            denomination: currentCongregation.denomination ?? "",
            location: currentCongregation.location ?? "",
            website: currentCongregation.website ?? "",
            about: currentCongregation.about ?? "",
            defaultBibleTranslationId:
                currentCongregation.defaultBibleTranslationId ?? "",
        })
    }, [currentCongregation])

    useEffect(() => {
        scriptureApi
            .listBibleTranslations()
            .then(setTranslations)
            .catch(() => setTranslations([]))
    }, [])

    useEffect(() => {
        if (!congregationId) return
        const activeCongregationId = congregationId

        async function loadAdminData() {
            setIsLoading(true)
            setPageError(null)

            try {
                const [memberList, sermonList] = await Promise.all([
                    congregationsApi.listCongregationMembers(activeCongregationId),
                    sermonsApi.listSermons(activeCongregationId),
                ])
                setMembers(memberList)
                setSermons(sermonList.data)
            } catch (err) {
                setPageError(err instanceof Error ? err.message : "Failed to load admin data")
            } finally {
                setIsLoading(false)
            }
        }

        loadAdminData().catch(() => {
            setPageError("Failed to load admin data")
            setIsLoading(false)
        })
    }, [congregationId])

    const myMembership = useMemo(
        () => members.find((member) => member.userId === user?.id) ?? null,
        [members, user?.id],
    )

    const canEditProfile = membershipHasPermission(myMembership, "edit_profile")
    const canManageMembers = membershipHasPermission(myMembership, "manage_members")
    const canManageSermons = membershipHasPermission(myMembership, "manage_sermons")

    if (!currentCongregation) {
        return (
            <div className="app-page">
                <SiteHeader
                    title="No congregation selected"
                    links={[{ label: "Home", to: "/" }]}
                />

                <main className="app-content">
                    <section className="panel">
                        <p className="panel-copy">
                            Create a congregation first to unlock sermon uploads, profile management, and member permissions.
                        </p>
                        <div className="action-row">
                            <Link className="button-link" to="/admin/congregation/new">
                                Create congregation
                            </Link>
                            <Link className="button-link secondary" to="/">
                                Home
                            </Link>
                        </div>
                    </section>
                </main>
            </div>
        )
    }

    async function handleSaveProfile(event: FormEvent) {
        if (!congregationId) return
        event.preventDefault()
        setProfileMessage(null)
        setPageError(null)
        setIsSavingProfile(true)

        try {
            await congregationsApi.updateCongregation(congregationId, {
                name: profileForm.name,
                denomination: profileForm.denomination || null,
                location: profileForm.location || null,
                website: profileForm.website || null,
                about: profileForm.about || null,
                defaultBibleTranslationId:
                    profileForm.defaultBibleTranslationId || null,
            })
            await refreshUser()
            setProfileMessage("Congregation profile updated.")
        } catch (err) {
            setPageError(err instanceof Error ? err.message : "Failed to update profile")
        } finally {
            setIsSavingProfile(false)
        }
    }

    async function handleUploadSermon(event: FormEvent) {
        if (!congregationId) return
        event.preventDefault()
        if (!selectedAudio) {
            setPageError("Select an audio file before uploading.")
            return
        }

        setPageError(null)
        setSermonMessage(null)
        setIsUploadingSermon(true)

        try {
            const sermon = await sermonsApi.uploadSermon({
                congregationId,
                title: sermonTitle,
                speaker: sermonSpeaker || undefined,
                recordedOn: sermonRecordedOn || undefined,
                scriptures: sermonScriptures.map(
                    ({ label: _label, ...citation }) => citation,
                ),
                audio: selectedAudio,
            })
            setSermons((current) => [sermon, ...current])
            setSermonTitle("")
            setSermonSpeaker("")
            setSermonRecordedOn("")
            setSermonScriptures([])
            setSelectedAudio(null)
            setSermonMessage("Sermon uploaded.")
        } catch (err) {
            setPageError(err instanceof Error ? err.message : "Failed to upload sermon")
        } finally {
            setIsUploadingSermon(false)
        }
    }

    async function handleDeleteSermon(sermonId: string) {
        if (!congregationId) return
        setPageError(null)
        setSermonMessage(null)

        try {
            await sermonsApi.deleteSermon(congregationId, sermonId)
            setSermons((current) => current.filter((sermon) => sermon.id !== sermonId))
            setSermonMessage("Sermon deleted.")
        } catch (err) {
            setPageError(err instanceof Error ? err.message : "Failed to delete sermon")
        }
    }

    async function handlePermissionToggle(
        member: CongregationMembership,
        permission: CongregationPermission,
        enabled: boolean,
    ) {
        if (!congregationId) return
        const permissionKey = `${member.id}:${permission}`
        setBusyPermissionKey(permissionKey)
        setPageError(null)
        setMemberMessage(null)

        try {
            if (enabled) {
                await congregationsApi.grantCongregationPermission(
                    congregationId,
                    member.userId,
                    permission,
                )
            } else {
                await congregationsApi.revokeCongregationPermission(
                    congregationId,
                    member.userId,
                    permission,
                )
            }

            setMembers((current) =>
                current.map((entry) => {
                    if (entry.id !== member.id) return entry

                    const hasPermission = entry.permissions.some(
                        (item) => item.permission === permission,
                    )

                    if (enabled && !hasPermission) {
                        return {
                            ...entry,
                            permissions: [
                                ...entry.permissions,
                                {
                                    id: `temp-${permission}`,
                                    membershipId: entry.id,
                                    permission,
                                },
                            ],
                        }
                    }

                    if (!enabled) {
                        return {
                            ...entry,
                            permissions: entry.permissions.filter(
                                (item) => item.permission !== permission,
                            ),
                        }
                    }

                    return entry
                }),
            )

            setMemberMessage("Member permissions updated.")
        } catch (err) {
            setPageError(err instanceof Error ? err.message : "Failed to update permission")
        } finally {
            setBusyPermissionKey(null)
        }
    }

    return (
        <div className="app-page">
            <SiteHeader
                title="Congregation Admin"
                links={[
                    { label: "Home", to: "/" },
                    { label: "Chat", to: "/conversations" },
                ]}
            />

            <main className="app-content admin-layout">
                {pageError && <div className="error-message">{pageError}</div>}

                <fieldset className="panel form-panel admin-panel">
                    <legend>Profile</legend>
                    <div className="section-heading">
                        <h2>Congregation details</h2>
                        {!canEditProfile && <span className="pill">Read only</span>}
                    </div>

                    <form className="stack-form" onSubmit={handleSaveProfile}>
                        <label className="form-field">
                            <span>Name</span>
                            <input
                                type="text"
                                value={profileForm.name}
                                onChange={(event) =>
                                    setProfileForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                disabled={!canEditProfile || isSavingProfile}
                                required
                            />
                        </label>

                        <label className="form-field">
                            <span>Denomination</span>
                            <input
                                type="text"
                                value={profileForm.denomination}
                                onChange={(event) =>
                                    setProfileForm((current) => ({
                                        ...current,
                                        denomination: event.target.value,
                                    }))
                                }
                                disabled={!canEditProfile || isSavingProfile}
                            />
                        </label>

                        <label className="form-field">
                            <span>Location</span>
                            <input
                                type="text"
                                value={profileForm.location}
                                onChange={(event) =>
                                    setProfileForm((current) => ({
                                        ...current,
                                        location: event.target.value,
                                    }))
                                }
                                disabled={!canEditProfile || isSavingProfile}
                            />
                        </label>

                        <label className="form-field">
                            <span>Website</span>
                            <input
                                type="url"
                                value={profileForm.website}
                                onChange={(event) =>
                                    setProfileForm((current) => ({
                                        ...current,
                                        website: event.target.value,
                                    }))
                                }
                                disabled={!canEditProfile || isSavingProfile}
                            />
                        </label>

                        <label className="form-field">
                            <span>Default Bible translation</span>
                            <select
                                value={profileForm.defaultBibleTranslationId}
                                onChange={(event) =>
                                    setProfileForm((current) => ({
                                        ...current,
                                        defaultBibleTranslationId:
                                            event.target.value,
                                    }))
                                }
                                disabled={!canEditProfile || isSavingProfile}
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
                                rows={4}
                                value={profileForm.about}
                                onChange={(event) =>
                                    setProfileForm((current) => ({
                                        ...current,
                                        about: event.target.value,
                                    }))
                                }
                                disabled={!canEditProfile || isSavingProfile}
                            />
                        </label>

                        <div className="action-row">
                            <button type="submit" disabled={!canEditProfile || isSavingProfile}>
                                {isSavingProfile ? "Saving..." : "Save profile"}
                            </button>
                            {profileMessage && <span className="status-copy">{profileMessage}</span>}
                        </div>
                    </form>
                </fieldset>

                <fieldset className="panel form-panel admin-panel">
                    <legend>Upload</legend>
                    <div className="section-heading">
                        <h2>Upload sermon audio</h2>
                        {!canManageSermons && <span className="pill">Read only</span>}
                    </div>

                    <form className="stack-form" onSubmit={handleUploadSermon}>
                        <label className="form-field">
                            <span>Title</span>
                            <input
                                type="text"
                                value={sermonTitle}
                                onChange={(event) => setSermonTitle(event.target.value)}
                                disabled={!canManageSermons || isUploadingSermon}
                                required
                            />
                        </label>

                        <div className="split-fields">
                            <label className="form-field">
                                <span>Speaker</span>
                                <input
                                    type="text"
                                    value={sermonSpeaker}
                                    onChange={(event) => setSermonSpeaker(event.target.value)}
                                    disabled={!canManageSermons || isUploadingSermon}
                                />
                            </label>

                            <label className="form-field">
                                <span>Recorded on</span>
                                <input
                                    type="date"
                                    value={sermonRecordedOn}
                                    onChange={(event) => setSermonRecordedOn(event.target.value)}
                                    disabled={!canManageSermons || isUploadingSermon}
                                />
                            </label>
                        </div>

                        {translations.length > 0 && (
                            <ScriptureCitationPicker
                                translations={translations}
                                defaultTranslationId={
                                    currentCongregation.effectiveBibleTranslationId
                                }
                                disabled={!canManageSermons || isUploadingSermon}
                                onAdd={(citation) =>
                                    setSermonScriptures((current) => [
                                        ...current,
                                        citation,
                                    ])
                                }
                            />
                        )}

                        <div className="scripture-chip-list">
                            {sermonScriptures.length === 0 ? (
                                <p className="panel-copy">
                                    No scripture references selected yet.
                                </p>
                            ) : (
                                sermonScriptures.map((scripture, index) => (
                                    <div
                                        key={`${scripture.translationId}:${scripture.label}:${index}`}
                                        className="scripture-chip"
                                    >
                                        <div>
                                            <strong>{scripture.label}</strong>
                                            <div className="meta-copy">
                                                {scripture.translationId.toUpperCase()}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSermonScriptures((current) =>
                                                    current.filter(
                                                        (_, itemIndex) =>
                                                            itemIndex !== index,
                                                    ),
                                                )
                                            }
                                            disabled={
                                                !canManageSermons ||
                                                isUploadingSermon
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <label className="form-field">
                            <span>Audio file</span>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={(event) =>
                                    setSelectedAudio(event.target.files?.[0] ?? null)
                                }
                                disabled={!canManageSermons || isUploadingSermon}
                                required
                            />
                        </label>

                        <div className="action-row">
                            <button
                                type="submit"
                                disabled={!canManageSermons || isUploadingSermon}
                            >
                                {isUploadingSermon ? "Uploading..." : "Upload sermon"}
                            </button>
                            {sermonMessage && <span className="status-copy">{sermonMessage}</span>}
                        </div>
                    </form>
                </fieldset>

                <fieldset className="panel form-panel admin-panel">
                    <legend>Library</legend>
                    <div className="section-heading">
                        <h2>Existing sermons</h2>
                        {!canManageSermons && <span className="pill">Read only</span>}
                    </div>

                    <div className="admin-list">
                        {isLoading ? (
                            <p className="panel-copy">Loading sermons...</p>
                        ) : sermons.length === 0 ? (
                            <p className="panel-copy">No sermons uploaded yet.</p>
                        ) : (
                            sermons.map((sermon) => (
                                <article key={sermon.id} className="admin-list-item">
                                    <div>
                                        <h3>{sermon.title}</h3>
                                        <p className="meta-copy">
                                            {sermon.speaker ?? "Unknown speaker"} | {formatDate(sermon.recordedOn)} | {sermon.transcriptionStatus}
                                        </p>
                                        <p className="meta-copy">
                                            {formatScriptures(sermon.scriptures)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteSermon(sermon.id)}
                                        disabled={!canManageSermons}
                                    >
                                        Delete
                                    </button>
                                </article>
                            ))
                        )}
                    </div>
                </fieldset>

                <fieldset className="panel form-panel admin-panel">
                    <legend>Members</legend>
                    <div className="section-heading">
                        <h2>Permission matrix</h2>
                        {!canManageMembers && <span className="pill">Read only</span>}
                    </div>

                    <p className="panel-copy">
                        Invite and membership creation can come next. This first pass lets you inspect existing members and manage permissions for them.
                    </p>

                    {memberMessage && <div className="inline-note">{memberMessage}</div>}

                    <div className="member-grid">
                        <div className="member-grid-header">Member</div>
                        {MANAGEABLE_PERMISSIONS.map((permission) => (
                            <div key={permission} className="member-grid-header">
                                {permission}
                            </div>
                        ))}

                        {members.map((member) => (
                            <MemberRow
                                key={member.id}
                                member={member}
                                permissions={MANAGEABLE_PERMISSIONS}
                                disabled={!canManageMembers}
                                busyPermissionKey={busyPermissionKey}
                                isCurrentUser={member.userId === user?.id}
                                onTogglePermission={handlePermissionToggle}
                            />
                        ))}
                    </div>
                </fieldset>
            </main>
        </div>
    )
}

type MemberRowProps = {
    member: CongregationMembership
    permissions: CongregationPermission[]
    disabled: boolean
    busyPermissionKey: string | null
    isCurrentUser: boolean
    onTogglePermission: (
        member: CongregationMembership,
        permission: CongregationPermission,
        enabled: boolean,
    ) => Promise<void>
}

function MemberRow({
    member,
    permissions,
    disabled,
    busyPermissionKey,
    isCurrentUser,
    onTogglePermission,
}: MemberRowProps) {
    return (
        <>
            <div className="member-cell member-identity">
                <strong>{member.user.email}</strong>
                {isCurrentUser && <span className="meta-copy">You</span>}
            </div>

            {permissions.map((permission) => {
                const checked = member.permissions.some((item) => item.permission === permission)
                const permissionKey = `${member.id}:${permission}`

                return (
                    <label key={permissionKey} className="member-cell member-toggle">
                        <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled || isCurrentUser || busyPermissionKey === permissionKey}
                            onChange={(event) =>
                                onTogglePermission(member, permission, event.target.checked)
                            }
                        />
                    </label>
                )
            })}
        </>
    )
}
