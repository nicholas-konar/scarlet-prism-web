import { apiCall } from "./client"
import type {
    Congregation,
    CongregationMembership,
    CongregationPermission,
} from "@/types/api"

export async function getCongregation(congregationId: string): Promise<Congregation> {
    return apiCall<Congregation>(`/congregations/${congregationId}`, {
        method: "GET",
    })
}

type UpsertCongregationRequest = {
    name: string
    denomination?: string | null
    location?: string | null
    website?: string | null
    about?: string | null
    defaultBibleTranslationId?: string | null
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

export async function updateCongregation(
    congregationId: string,
    data: Partial<UpsertCongregationRequest>,
): Promise<Congregation> {
    return apiCall<Congregation>(`/congregations/${congregationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
}

export async function listCongregationMembers(
    congregationId: string,
): Promise<CongregationMembership[]> {
    const response = await apiCall<{ members: CongregationMembership[] }>(
        `/congregations/${congregationId}/members`,
        { method: "GET" },
    )
    return response.members
}

export async function grantCongregationPermission(
    congregationId: string,
    targetUserId: string,
    permission: CongregationPermission,
): Promise<void> {
    await apiCall(`/congregations/${congregationId}/members/${targetUserId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission }),
    })
}

export async function revokeCongregationPermission(
    congregationId: string,
    targetUserId: string,
    permission: CongregationPermission,
): Promise<void> {
    await apiCall(
        `/congregations/${congregationId}/members/${targetUserId}/permissions/${permission}`,
        {
            method: "DELETE",
        },
    )
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
