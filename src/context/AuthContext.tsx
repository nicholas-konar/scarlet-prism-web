import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import type { User, Congregation } from "@/types/api"
import * as authApi from "@/api/auth"
import * as congregationsApi from "@/api/congregations"

interface AuthContextValue {
    token: string | null
    user: User | null
    currentCongregation: Congregation | null
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    signup: (email: string, password: string) => Promise<void>
    logout: () => void
    refreshUser: () => Promise<void>
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [currentCongregation, setCurrentCongregation] = useState<Congregation | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    async function loadCongregation(congregationId: string | null) {
        if (!congregationId) {
            setCurrentCongregation(null)
            return
        }
        try {
            const congregation = await congregationsApi.getCongregation(congregationId)
            setCurrentCongregation(congregation)
        } catch {
            setCurrentCongregation(null)
        }
    }

    async function refreshUser() {
        const nextUser = await authApi.getMe()
        setUser(nextUser)
        await loadCongregation(nextUser.congregationId)
    }

    useEffect(() => {
        const storedToken = localStorage.getItem("token")
        if (storedToken) {
            setToken(storedToken)
            refreshUser()
                .catch(() => {
                    localStorage.removeItem("token")
                    setToken(null)
                    setUser(null)
                    setCurrentCongregation(null)
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
        await loadCongregation(response.user.congregationId)
    }

    const signup = async (email: string, password: string) => {
        const response = await authApi.signup({ email, password })
        localStorage.setItem("token", response.token)
        setToken(response.token)
        setUser(response.user)
        await loadCongregation(response.user.congregationId)
    }

    const logout = () => {
        localStorage.removeItem("token")
        setToken(null)
        setUser(null)
        setCurrentCongregation(null)
    }

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                currentCongregation,
                isLoading,
                login,
                signup,
                logout,
                refreshUser,
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
