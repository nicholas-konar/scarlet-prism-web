import { FormEvent, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            await login(email, password)
            navigate("/", { replace: true })
        } catch (err) {
            const message = err instanceof Error ? err.message : "Login failed"
            setError(message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <fieldset className="auth-container">
                <legend>Scarlet Prism</legend>
                <p className="subtitle">beta</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <fieldset className="form-group">
                        <legend>Email</legend>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            disabled={isLoading}
                            required
                        />
                    </fieldset>

                    <fieldset className="form-group">
                        <legend>Password</legend>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isLoading}
                            required
                        />
                    </fieldset>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={isLoading} className="submit-btn">
                        {isLoading ? "Logging in..." : "Log In"}
                    </button>
                </form>

                <p className="auth-link">
                    Don't have an account? <Link to="/signup">Sign up here</Link>
                </p>
            </fieldset>
        </div>
    )
}
