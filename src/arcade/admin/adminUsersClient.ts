import { createAuthenticatedFetch, type ClientIdentityUser } from '../../shared/identity'

export interface AdminUsersClient {
  search(query: string): Promise<ClientIdentityUser[]>
  updateDinoCoins(userId: string, dinoCoins: number): Promise<ClientIdentityUser>
}

export class AdminUsersClientError extends Error {
  constructor() { super('The users could not be loaded.'); this.name = 'AdminUsersClientError' }
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
  } }
}
