import { describe, expect, it, vi } from 'vitest'
import type { RequestAuthenticator } from '../../auth/requestAuthentication'
import { createAdminUsersHandler } from './adminUsersHandler'
import { RequestAuthenticationError } from '../../auth/requestAuthentication/requestAuthenticationErrors'

const listedUser = { id: 'user-1', name: 'Dino Player', email: 'dino@example.com', role: 'VIEWER' as const, dinoCoins: 12, profileImage: null }
interface HandlerCase { name: string; input: { role: 'ADMIN' | 'VIEWER'; query: string; authenticated: boolean }; expected: { status: number; code: string | undefined; search: string | undefined; users: typeof listedUser[] | undefined } }
const cases: HandlerCase[] = [
  { name: 'allows admins to list every registered user', input: { role: 'ADMIN' as const, query: '', authenticated: true }, expected: { status: 200, code: undefined, search: '', users: [listedUser] } },
  { name: 'passes a partial name or email query to the repository', input: { role: 'ADMIN' as const, query: 'DiNo', authenticated: true }, expected: { status: 200, code: undefined, search: 'DiNo', users: [listedUser] } },
  { name: 'prevents viewers from calling the endpoint', input: { role: 'VIEWER' as const, query: 'dino', authenticated: true }, expected: { status: 403, code: 'FORBIDDEN', search: undefined, users: undefined } },
  { name: 'requires an authenticated request', input: { role: 'ADMIN' as const, query: '', authenticated: false }, expected: { status: 401, code: 'UNAUTHENTICATED', search: undefined, users: undefined } },
]

describe('admin users handler', () => {
  it.each(cases)('$name', async ({ input, expected }) => {
    const authenticate = input.authenticated
      ? vi.fn().mockResolvedValue({ userId: 'current-user', role: input.role })
      : vi.fn().mockRejectedValue(new RequestAuthenticationError('INVALID_ACCESS_TOKEN'))
    const authenticator: RequestAuthenticator = { authenticate }
    const searches: string[] = []
    const search = vi.fn((query: string) => { searches.push(query); return Promise.resolve([listedUser]) })
    const response = await createAdminUsersHandler(authenticator, { search, setDinoCoins: vi.fn() })(new Request(`http://localhost/api/admin/users?q=${input.query}`, { headers: { authorization: 'Bearer token' } }))
    const body = await response.json() as { users?: typeof listedUser[]; error?: { code: string } }
    expect({ status: response.status, code: body.error?.code, search: searches[0], users: body.users }).toEqual(expected)
  })
})
