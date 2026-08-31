import type { ClientIdentitySession } from './clientIdentityStore'
import { setAccessToken } from './accessTokenStore'
import type { ClientIdentityUser } from './guestIdentityTypes'
import { isProfileImage } from '../profile'

export class ClientIdentitySessionError extends Error {
  constructor() {
    super('The client identity session request failed.')
    this.name = 'ClientIdentitySessionError'
  }
}

export function createBrowserClientIdentitySession(fetcher: typeof fetch = fetch): ClientIdentitySession {
  return {
    async restore() {
      try {
        const refreshResponse = await fetcher('/api/refresh', { method: 'POST' })
        if (!refreshResponse.ok) {
          setAccessToken(null)
          return null
        }
        const refreshBody = await readBody(refreshResponse)
        if (typeof refreshBody.accessToken !== 'string') {
          setAccessToken(null)
          return null
        }

        const identityResponse = await fetcher('/api/me', {
          headers: { authorization: `Bearer ${refreshBody.accessToken}` },
        })
        const identityBody = await readBody(identityResponse)
        if (!identityResponse.ok || !isClientIdentityUser(identityBody.user)) {
          setAccessToken(null)
          return null
        }
        setAccessToken(refreshBody.accessToken)
        return identityBody.user
      } catch {
        setAccessToken(null)
        return null
      }
    },
    async logout() {
      const response = await fetcher('/api/logout', { method: 'POST' })
      if (!response.ok) throw new ClientIdentitySessionError()
      setAccessToken(null)
    },
  }
}

interface SessionResponseBody {
  accessToken?: unknown
  user?: unknown
}

async function readBody(response: Response): Promise<SessionResponseBody> {
  try { return await response.json() as SessionResponseBody } catch { return {} }
}

function isClientIdentityUser(value: unknown): value is ClientIdentityUser {
  if (!value || typeof value !== 'object') return false
  const user = value as Partial<Record<keyof ClientIdentityUser, unknown>>
  return typeof user.id === 'string'
    && typeof user.name === 'string'
    && typeof user.email === 'string'
    && (user.role === 'ADMIN' || user.role === 'VIEWER')
    && typeof user.dinoCoins === 'number'
    && isProfileImage(user.profileImage)
}
