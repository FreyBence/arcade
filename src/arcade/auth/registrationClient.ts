import type { ClientIdentityUser } from '../../shared/identity'

export interface RegistrationFormInput {
  name: string
  email: string
  password: string
}

export interface RegistrationClient {
  register(input: RegistrationFormInput): Promise<ClientIdentityUser>
}

export class RegistrationClientError extends Error {
  constructor(public readonly code: 'DUPLICATE_EMAIL' | 'INVALID_REQUEST' | 'UNAVAILABLE') {
    super(code)
    this.name = 'RegistrationClientError'
  }
}

interface ErrorBody { error?: { code?: unknown } }
interface UserBody { user?: ClientIdentityUser }

async function readBody(response: Response): Promise<ErrorBody & UserBody> {
  try {
    return await response.json() as ErrorBody & UserBody
  } catch {
    return {}
  }
}

export function createBrowserRegistrationClient(fetcher: typeof fetch = fetch): RegistrationClient {
  return {
    async register(input) {
      const registrationResponse = await fetcher('/api/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      })
      const registrationBody = await readBody(registrationResponse)
      if (!registrationResponse.ok) {
        const code = registrationBody.error?.code
        if (code === 'DUPLICATE_EMAIL' || code === 'INVALID_REQUEST') throw new RegistrationClientError(code)
        throw new RegistrationClientError('UNAVAILABLE')
      }

      const loginResponse = await fetcher('/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: input.email, password: input.password }),
      })
      const loginBody = await readBody(loginResponse)
      if (!loginResponse.ok || !loginBody.user) throw new RegistrationClientError('UNAVAILABLE')

      const { id, name, email, role, dinoCoins } = loginBody.user
      return { id, name, email, role, dinoCoins }
    },
  }
}
