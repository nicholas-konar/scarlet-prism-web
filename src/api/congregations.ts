import { apiCall } from "./client"
import type { Congregation } from "@/types/api"

export async function getCongregation(congregationId: string): Promise<Congregation> {
    return apiCall<Congregation>(`/congregations/${congregationId}`, {
        method: "GET",
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
