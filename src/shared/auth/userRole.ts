import { DEFAULT_USER_ROLE, USER_ROLES } from './constants'

export type UserRole = (typeof USER_ROLES)[number]

export { DEFAULT_USER_ROLE, USER_ROLES }

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.some((role) => role === value)
}
