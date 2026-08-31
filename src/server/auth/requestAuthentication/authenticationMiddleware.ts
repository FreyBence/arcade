import { jsonResponse } from '../utils'
import { RequestAuthenticationError } from './requestAuthenticationErrors'
import type { AuthenticatedRequestHandler, RequestAuthenticator } from './requestAuthenticationTypes'

export function withAuthentication(
  authenticator: RequestAuthenticator,
  handler: AuthenticatedRequestHandler,
) {
  return async function authenticatedHandler(request: Request): Promise<Response> {
    try {
      const identity = await authenticator.authenticate(request)
      return handler(request, identity)
    } catch (error) {
      if (error instanceof RequestAuthenticationError) {
        return jsonResponse({ error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' } }, 401)
      }
      throw error
    }
  }
}
