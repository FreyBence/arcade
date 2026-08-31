import { createAuthenticatedFetch, type ClientIdentityUser } from '../../shared/identity'

export interface ProfileFormInput { name: string; email: string }
export interface ProfileClient { update(input: ProfileFormInput): Promise<ClientIdentityUser> }
export class ProfileClientError extends Error {
  constructor(public readonly code: 'INVALID_PROFILE' | 'DUPLICATE_EMAIL' | 'UNAUTHORIZED' | 'UNAVAILABLE') { super(code); this.name = 'ProfileClientError' }
}
export function createBrowserProfileClient(fetcher: typeof fetch = fetch): ProfileClient {
  const authenticatedFetch = createAuthenticatedFetch(fetcher)
  return { async update(input) {
    const response = await authenticatedFetch('/api/profile', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) })
    let body: { user?: ClientIdentityUser; error?: { code?: unknown } } = {}
    try { body = await response.json() as typeof body } catch { /* handled below */ }
    if (!response.ok) {
      const code = body.error?.code
      if (code === 'INVALID_PROFILE' || code === 'DUPLICATE_EMAIL') throw new ProfileClientError(code)
      if (response.status === 401) throw new ProfileClientError('UNAUTHORIZED')
      throw new ProfileClientError('UNAVAILABLE')
    }
    if (!body.user) throw new ProfileClientError('UNAVAILABLE')
    const { id, name, email, role, dinoCoins } = body.user
    return { id, name, email, role, dinoCoins }
  } }
}
