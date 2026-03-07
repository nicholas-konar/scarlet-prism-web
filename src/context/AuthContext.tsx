import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import type { User } from "@/types/api"
import * as authApi from "@/api/auth"

interface AuthContextValue {
    token: string | null
    user: User | null
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    signup: (email: string, password: string) => Promise<void>
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Load token from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem("token")
        if (storedToken) {
            setToken(storedToken)
            // Try to verify token is still valid by fetching user
            authApi
                .getMe()
                .then((u) => setUser(u))
                .catch(() => {
                    // Token is invalid, clear it
                    localStorage.removeItem("token")
                    setToken(null)
                })
                .finally(() => setIsLoading(false))
        } else {
            setIsLoading(false)
        }
    }, [])

    const login = async (email: string, password: string) => {
        const response = await authApi.login({ email, password })
        localStorage.setItem("token", response.token)
        setToken(response.token)
        setUser(response.user)
    }

    const signup = async (email: string, password: string) => {
        const response = await authApi.signup({ email, password })
        localStorage.setItem("token", response.token)
        setToken(response.token)
        setUser(response.user)
    }

    const logout = () => {
        localStorage.removeItem("token")
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                isLoading,
                login,
                signup,
                logout,
                isAuthenticated: !!token,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider")
    }
    return context
}
