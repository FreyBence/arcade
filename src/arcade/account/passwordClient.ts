import { createAuthenticatedFetch } from '../../shared/identity'

export interface PasswordChangeInput { currentPassword: string; newPassword: string }
export interface PasswordClient { change(input: PasswordChangeInput): Promise<void> }
export class PasswordClientError extends Error {
  constructor(public readonly code: 'INVALID_PASSWORD_CHANGE' | 'INCORRECT_CURRENT_PASSWORD' | 'UNAUTHORIZED' | 'UNAVAILABLE') {
    super(code); this.name = 'PasswordClientError'
  }
}

export function createBrowserPasswordClient(fetcher: typeof fetch = fetch): PasswordClient {
  const authenticatedFetch = createAuthenticatedFetch(fetcher)
  return { async change(input) {
    const response = await authenticatedFetch('/api/password', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) })
    let body: { error?: { code?: unknown } } = {}
    try { body = await response.json() as typeof body } catch { /* handled below */ }
    if (response.ok) return
    const code = body.error?.code
    if (code === 'INVALID_PASSWORD_CHANGE' || code === 'INCORRECT_CURRENT_PASSWORD') throw new PasswordClientError(code)
    if (response.status === 401) throw new PasswordClientError('UNAUTHORIZED')
    throw new PasswordClientError('UNAVAILABLE')
  } }
}
