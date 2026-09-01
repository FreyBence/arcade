import { protectAdminEndpoint } from '../../auth/authorization'
import type { RequestAuthenticator } from '../../auth/requestAuthentication'
import { jsonResponse } from '../../auth/utils'
import type { AdminUserRepository } from './adminUsersTypes'

export function createAdminUsersHandler(authenticator: RequestAuthenticator, users: AdminUserRepository) {
  return protectAdminEndpoint(authenticator, async (request) => {
    const query = new URL(request.url).searchParams.get('q') ?? ''
    return jsonResponse({ users: await users.search(query) }, 200)
  })
}
