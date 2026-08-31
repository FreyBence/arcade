import type { ClientIdentityUser } from '../../shared/identity'
import { setAccessToken } from '../../shared/identity'

export interface LoginFormInput { email: string; password: string }
export interface LoginClient { login(input: LoginFormInput): Promise<ClientIdentityUser> }

export class LoginClientError extends Error {
  constructor(public readonly code: 'INVALID_CREDENTIALS' | 'INVALID_REQUEST' | 'UNAVAILABLE') {
    super(code)
    this.name = 'LoginClientError'
  }
}

interface LoginResponseBody { accessToken?: unknown; error?: { code?: unknown }; user?: ClientIdentityUser }

async function readBody(response: Response): Promise<LoginResponseBody> {
  try { return await response.json() as LoginResponseBody } catch { return {} }
}

export function createBrowserLoginClient(fetcher: typeof fetch = fetch): LoginClient {
  return {
    async login(input) {
      const response = await fetcher('/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      })
      const body = await readBody(response)
      if (!response.ok) {
        const code = body.error?.code
        if (code === 'INVALID_CREDENTIALS' || code === 'INVALID_REQUEST') throw new LoginClientError(code)
        throw new LoginClientError('UNAVAILABLE')
      }
      if (!body.user || typeof body.accessToken !== 'string') throw new LoginClientError('UNAVAILABLE')
      const { id, name, email, role, dinoCoins, profileImage } = body.user
      setAccessToken(body.accessToken)
      return { id, name, email, role, dinoCoins, profileImage }
    },
  }
}
