import { protectAdminEndpoint } from '../../auth/authorization'
import type { RequestAuthenticator } from '../../auth/requestAuthentication'
import { jsonResponse } from '../../auth/utils'
import { AdminRoleValidationError, parseAdminRoleInput } from './adminRoleValidation'
import type { AdminRoleRepository } from './adminUsersTypes'

export function createAdminRoleHandler(authenticator: RequestAuthenticator, users: AdminRoleRepository) {
  return protectAdminEndpoint(authenticator, async (request) => {
    try {
      let body: unknown
      try { body = await request.json() } catch { throw new AdminRoleValidationError() }
      const input = parseAdminRoleInput(body)
      const result = await users.setRole(input.userId, input.role)
      if (result.status === 'not-found') return jsonResponse({ error: { code: 'USER_NOT_FOUND', message: 'The selected user does not exist.' } }, 404)
      if (result.status === 'last-admin') return jsonResponse({ error: { code: 'LAST_ADMIN', message: 'The last remaining administrator cannot be demoted.' } }, 409)
      return jsonResponse({ user: result.user }, 200)
    } catch (error) {
      if (error instanceof AdminRoleValidationError) return jsonResponse({ error: { code: 'INVALID_USER_ROLE', message: error.message } }, 400)
      throw error
    }
  })
}
