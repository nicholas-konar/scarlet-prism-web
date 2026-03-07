import { apiCall } from "./client"
import type { AuthResponse, SignupRequest, LoginRequest, User } from "@/types/api"

export async function signup(data: SignupRequest): Promise<AuthResponse> {
    return apiCall<AuthResponse>("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
    return apiCall<AuthResponse>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
}

export async function getMe(): Promise<User> {
    return apiCall<User>("/auth/me", {
        method: "GET",
    })
}
