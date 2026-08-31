import { withAuthenticationAndRoles } from './authorizationMiddleware'
import type { AuthenticatedRequestHandler, RequestAuthenticator } from '../requestAuthentication'

const ADMIN_ONLY = ['ADMIN'] as const

export function protectAdminEndpoint(
  authenticator: RequestAuthenticator,
  handler: AuthenticatedRequestHandler,
) {
  return withAuthenticationAndRoles(authenticator, ADMIN_ONLY, handler)
}
