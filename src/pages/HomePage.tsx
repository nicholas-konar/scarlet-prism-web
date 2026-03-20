import { Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export function HomePage() {
    const { user, logout, currentCongregation } = useAuth()

    return (
        <div className="app-page">
            <header className="app-header">
                <div>
                    <p className="eyebrow">Scarlet Prism</p>
                    <h1>Workspace</h1>
                </div>
                <div className="app-header-actions">
                    <span className="user-email">{user?.email}</span>
                    <button type="button" onClick={logout}>
                        Log out
                    </button>
                </div>
            </header>

            <main className="app-content">
                <section className="panel hero-panel">
                    <p className="eyebrow">Current focus</p>
                    <h2>
                        {currentCongregation
                            ? currentCongregation.name
                            : "Account is ready"}
                    </h2>
                    <p className="panel-copy">
                        {currentCongregation
                            ? "Use the admin area to manage sermons, profile details, and member permissions for your congregation."
                            : "Congregation setup is intended for pastors and church staff. Regular attendee flows can come later without putting this action front and center."}
                    </p>

                    <div className="action-row">
                        {currentCongregation ? (
                            <>
                                <Link className="button-link" to="/admin/congregation">
                                    Open admin
                                </Link>
                                <Link className="button-link secondary" to="/conversations">
                                    Open chat
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link className="button-link secondary" to="/admin/congregation/new">
                                    Register a congregation
                                </Link>
                                <Link className="button-link" to="/conversations">
                                    Open chat
                                </Link>
                            </>
                        )}
                    </div>
                </section>

                <section className="panel info-grid">
                    <div className="info-card">
                        <p className="eyebrow">Admin path</p>
                        <h3>Low-profile entrypoint</h3>
                        <p className="panel-copy">
                            Church creation is available, but not promoted as the primary action for most signed-in users.
                        </p>
                    </div>

                    <div className="info-card">
                        <p className="eyebrow">Current congregation</p>
                        <h3>{currentCongregation?.name ?? "None selected"}</h3>
                        <p className="panel-copy">
                            {currentCongregation?.location ??
                                "Once a congregation exists, this page can branch into the member-facing experience later."}
                        </p>
                    </div>
                </section>
            </main>
        </div>
    )
}
