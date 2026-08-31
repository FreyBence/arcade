import { RequestAuthenticationError } from './requestAuthentication/requestAuthenticationErrors'
import type { RequestAuthenticator } from './requestAuthentication'
import type { SafeUser } from './registrationTypes'
import { jsonResponse } from './utils'

interface IdentityUserRepository {
  findSafeById(id: string): Promise<SafeUser | null>
}

export function createIdentityHandler(authenticator: RequestAuthenticator, users: IdentityUserRepository) {
  return async function handleIdentity(request: Request): Promise<Response> {
    try {
      const identity = await authenticator.authenticate(request)
      const user = await users.findSafeById(identity.userId)
      if (!user) {
        return jsonResponse({ error: { code: 'INVALID_ACCESS_TOKEN', message: 'Authentication is required.' } }, 401)
      }
      return jsonResponse({ user }, 200)
    } catch (error) {
      if (error instanceof RequestAuthenticationError) {
        return jsonResponse({ error: { code: error.code, message: error.message } }, 401)
      }
      throw error
    }
  }
}
