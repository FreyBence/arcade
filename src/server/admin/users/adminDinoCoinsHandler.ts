import { protectAdminEndpoint } from '../../auth/authorization'
import type { RequestAuthenticator } from '../../auth/requestAuthentication'
import { jsonResponse } from '../../auth/utils'
import { AdminDinoCoinsValidationError, parseAdminDinoCoinsInput } from './adminDinoCoinsValidation'
import type { AdminUserRepository } from './adminUsersTypes'

export function createAdminDinoCoinsHandler(authenticator: RequestAuthenticator, users: AdminUserRepository) {
  return protectAdminEndpoint(authenticator, async (request) => {
    try {
      let body: unknown
      try { body = await request.json() } catch { throw new AdminDinoCoinsValidationError() }
      const input = parseAdminDinoCoinsInput(body)
      const user = await users.setDinoCoins(input.userId, input.dinoCoins)
      if (!user) return jsonResponse({ error: { code: 'USER_NOT_FOUND', message: 'The selected user does not exist.' } }, 404)
      return jsonResponse({ user }, 200)
    } catch (error) {
      if (error instanceof AdminDinoCoinsValidationError) {
        return jsonResponse({ error: { code: 'INVALID_DINO_COIN_BALANCE', message: error.message } }, 400)
      }
      throw error
    }
  })
}
