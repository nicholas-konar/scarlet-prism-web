import { apiCall } from "./client"
import type { Congregation } from "@/types/api"

type UpsertCongregationRequest = {
    name: string
    denomination?: string | null
    location?: string | null
    website?: string | null
    about?: string | null
}

export async function getCongregation(congregationId: string): Promise<Congregation> {
    return apiCall<Congregation>(`/congregations/${congregationId}`, {
        method: "GET",
    })
}

export async function createCongregation(
    data: UpsertCongregationRequest,
): Promise<{ id: string }> {
    return apiCall<{ id: string }>("/congregations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
}

export async function setCurrentCongregation(
    congregationId: string | null,
): Promise<void> {
    await apiCall("/user/settings/congregation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ congregationId }),
    })
}
