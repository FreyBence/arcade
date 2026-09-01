import type { RequestAuthenticator } from '../requestAuthentication'
import { RequestAuthenticationError } from '../requestAuthentication/requestAuthenticationErrors'
import { jsonResponse } from '../utils'
import { PasswordChangeError } from './passwordChangeErrors'
import { changePassword } from './passwordChangeService'
import type { PasswordChangeDependencies } from './passwordChangeTypes'
import { parsePasswordChangeInput } from './passwordChangeValidation'

export function createPasswordChangeHandler(authenticator: RequestAuthenticator, dependencies: PasswordChangeDependencies) {
  return async function handlePasswordChange(request: Request): Promise<Response> {
    try {
      const identity = await authenticator.authenticate(request)
      let body: unknown
      try { body = await request.json() } catch {
        return jsonResponse({ error: { code: 'INVALID_PASSWORD_CHANGE', message: 'Request body must be valid JSON.' } }, 400)
      }
      const updated = await changePassword(identity.userId, parsePasswordChangeInput(body), dependencies)
      if (!updated) return jsonResponse({ error: { code: 'INVALID_ACCESS_TOKEN', message: 'Authentication is required.' } }, 401)
      return jsonResponse({ success: true }, 200)
    } catch (error) {
      if (error instanceof RequestAuthenticationError) return jsonResponse({ error: { code: error.code, message: error.message } }, 401)
      if (error instanceof PasswordChangeError) {
        const status = error.code === 'INCORRECT_CURRENT_PASSWORD' ? 403 : 400
        return jsonResponse({ error: { code: error.code, message: error.message } }, status)
      }
      throw error
    }
  }
}
