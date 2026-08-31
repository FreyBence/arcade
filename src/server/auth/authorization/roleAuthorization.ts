import type { UserRole } from '../../../shared/auth'
import type { RequestIdentity } from '../requestAuthentication'
import { RoleAuthorizationError } from './authorizationErrors'

export function requireAnyRole(identity: RequestIdentity, allowedRoles: readonly UserRole[]): void {
  if (!allowedRoles.includes(identity.role)) throw new RoleAuthorizationError()
}
