import { DuplicateEmailError } from '../auth/registrationErrors'
import { RequestAuthenticationError } from '../auth/requestAuthentication/requestAuthenticationErrors'
import type { RequestAuthenticator } from '../auth/requestAuthentication'
import { jsonResponse } from '../auth/utils'
import { ProfileError } from './profileErrors'
import type { ProfileUserRepository } from './profileTypes'
import { parseProfileInput } from './profileValidation'

export function createProfileHandler(authenticator: RequestAuthenticator, users: ProfileUserRepository) {
  return async function handleProfile(request: Request): Promise<Response> {
    try {
      const identity = await authenticator.authenticate(request)
      let body: unknown
      try { body = await request.json() } catch {
        return jsonResponse({ error: { code: 'INVALID_PROFILE', message: 'Request body must be valid JSON.' } }, 400)
      }
      const user = await users.updateProfile(identity.userId, parseProfileInput(body))
      if (!user) return jsonResponse({ error: { code: 'INVALID_ACCESS_TOKEN', message: 'Authentication is required.' } }, 401)
      return jsonResponse({ user }, 200)
    } catch (error) {
      if (error instanceof RequestAuthenticationError) {
        return jsonResponse({ error: { code: error.code, message: error.message } }, 401)
      }
      if (error instanceof DuplicateEmailError) {
        return jsonResponse({ error: { code: 'DUPLICATE_EMAIL', message: error.message } }, 409)
      }
      if (error instanceof ProfileError) {
        return jsonResponse({ error: { code: error.code, message: error.message } }, 400)
      }
      throw error
    }
  }
}
