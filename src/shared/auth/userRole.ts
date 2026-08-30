export const USER_ROLES = ['ADMIN', 'VIEWER'] as const

export type UserRole = (typeof USER_ROLES)[number]

export const DEFAULT_USER_ROLE: UserRole = 'VIEWER'

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.some((role) => role === value)
}
