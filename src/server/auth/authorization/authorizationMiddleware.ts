import type { UserRole } from '../../../shared/auth'
import { jsonResponse } from '../utils'
import { withAuthentication, type AuthenticatedRequestHandler, type RequestAuthenticator } from '../requestAuthentication'
import { RoleAuthorizationError } from './authorizationErrors'
import { requireAnyRole } from './roleAuthorization'

export function withRoleAuthorization(
  allowedRoles: readonly UserRole[],
  handler: AuthenticatedRequestHandler,
): AuthenticatedRequestHandler {
  return async function authorizedHandler(request, identity) {
    try {
      requireAnyRole(identity, allowedRoles)
      return handler(request, identity)
    } catch (error) {
      if (error instanceof RoleAuthorizationError) {
        return jsonResponse({ error: { code: 'FORBIDDEN', message: error.message } }, 403)
      }
      throw error
    }
  }
}

export function withAuthenticationAndRoles(
  authenticator: RequestAuthenticator,
  allowedRoles: readonly UserRole[],
  handler: AuthenticatedRequestHandler,
) {
  return withAuthentication(authenticator, withRoleAuthorization(allowedRoles, handler))
}
