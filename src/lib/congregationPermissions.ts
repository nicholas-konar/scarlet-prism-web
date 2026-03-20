import type { CongregationMembership, CongregationPermission } from "@/types/api"

export function membershipHasPermission(
    membership: CongregationMembership | null | undefined,
    permission: CongregationPermission,
): boolean {
    if (!membership) return false

    const held = membership.permissions.map((item) => item.permission)
    return held.includes("super_admin") || held.includes(permission)
}
