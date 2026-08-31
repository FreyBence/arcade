import type { ClientIdentitySession } from './clientIdentityStore'

export class ClientIdentitySessionError extends Error {
  constructor() {
    super('The client identity session request failed.')
    this.name = 'ClientIdentitySessionError'
  }
}

export function createBrowserClientIdentitySession(fetcher: typeof fetch = fetch): ClientIdentitySession {
  return {
    restore: () => Promise.resolve(null),
    async logout() {
      const response = await fetcher('/api/logout', { method: 'POST' })
      if (!response.ok) throw new ClientIdentitySessionError()
    },
  }
}
