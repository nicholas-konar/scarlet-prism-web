import { apiCall } from "./client"
import type { User } from "@/types/api"

export async function setDefaultBibleTranslation(
    defaultBibleTranslationId: string | null,
): Promise<User> {
    return apiCall<User>("/user/settings/bible-translation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultBibleTranslationId }),
    })
}
