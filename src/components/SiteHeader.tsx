import { Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

type HeaderLink = {
    label: string
    to: string
}

interface SiteHeaderProps {
    title: string
    eyebrow?: string | null
    links?: HeaderLink[]
}

export function SiteHeader({
    title,
    eyebrow = "Scarlet Prism",
    links = [],
}: SiteHeaderProps) {
    const { user, currentCongregation, logout } = useAuth()

    return (
        <header className="app-header site-header">
            <div className="site-header-main">
                {eyebrow && <p className="eyebrow">{eyebrow}</p>}
                <div className="site-header-title-row">
                    <h1>{title}</h1>
                    {currentCongregation && (
                        <Link
                            className="congregation-name congregation-link"
                            to={`/congregations/${currentCongregation.id}`}
                        >
                            {currentCongregation.name}
                        </Link>
                    )}
                </div>
            </div>

            <div className="site-header-actions">
                {links.length > 0 && (
                    <nav className="header-nav">
                        {links.map((link) => (
                            <Link key={`${link.to}-${link.label}`} to={link.to}>
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                )}

                <div className="site-header-meta">
                    <span className="user-email">{user?.email}</span>
                    <button type="button" className="logout-btn" onClick={logout}>
                        Log out
                    </button>
                </div>
            </div>
        </header>
    )
}
