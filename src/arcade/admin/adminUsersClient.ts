import { createAuthenticatedFetch, type ClientIdentityUser } from '../../shared/identity'
import type { UserRole } from '../../shared/auth'

export interface AdminUsersClient {
  search(query: string): Promise<ClientIdentityUser[]>
  updateDinoCoins(userId: string, dinoCoins: number): Promise<ClientIdentityUser>
  updateRole(userId: string, role: UserRole): Promise<ClientIdentityUser>
}

export class AdminUsersClientError extends Error {
  constructor(message = 'The users could not be loaded.') { super(message); this.name = 'AdminUsersClientError' }
}

export function createBrowserAdminUsersClient(fetcher: typeof fetch = fetch): AdminUsersClient {
  const authenticatedFetch = createAuthenticatedFetch(fetcher)
  return { async search(query) {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    const response = await authenticatedFetch(`/api/admin/users${params.size ? `?${params}` : ''}`)
    let body: { users?: ClientIdentityUser[] } = {}
    try { body = await response.json() as typeof body } catch { /* handled below */ }
    if (!response.ok || !Array.isArray(body.users)) throw new AdminUsersClientError()
    return body.users
  }, async updateDinoCoins(userId, dinoCoins) {
    const response = await authenticatedFetch('/api/admin/users/dino-coins', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, dinoCoins }),
    })
    let body: { user?: ClientIdentityUser } = {}
    try { body = await response.json() as typeof body } catch { /* handled below */ }
    if (!response.ok || !body.user) throw new AdminUsersClientError()
    return body.user
  }, async updateRole(userId, role) {
    const response = await authenticatedFetch('/api/admin/users/role', {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId, role }),
    })
    let body: { user?: ClientIdentityUser; error?: { message?: string } } = {}
    try { body = await response.json() as typeof body } catch { /* handled below */ }
    if (!response.ok || !body.user) throw new AdminUsersClientError(body.error?.message)
    return body.user
  } }
}
