import { FormEvent, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export function SignupPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { signup } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)

        try {
            await signup(email, password)
            navigate("/conversations", { replace: true })
        } catch (err) {
            const message = err instanceof Error ? err.message : "Signup failed"
            setError(message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <fieldset className="auth-container">
                <legend>Scarlet Prism</legend>
                <p className="subtitle">Beta</p>

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

                    <fieldset className="form-group">
                        <legend>Confirm Password</legend>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isLoading}
                            required
                        />
                    </fieldset>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={isLoading} className="submit-btn">
                        {isLoading ? "Signing up..." : "Sign Up"}
                    </button>
                </form>

                <p className="auth-link">
                    Already have an account? <Link to="/login">Log in here</Link>
                </p>
            </fieldset>
        </div>
    )
}
