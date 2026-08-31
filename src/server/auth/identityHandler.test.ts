import { describe, expect, it, vi } from 'vitest'
import type { RequestAuthenticator } from './requestAuthentication'
import { RequestAuthenticationError } from './requestAuthentication'
import { createIdentityHandler } from './identityHandler'

const USER = {
  id: '0198f8f2-8ad8-7000-8000-000000000001',
  name: 'Dino Player',
  email: 'player@example.com',
  role: 'VIEWER' as const,
  dinoCoins: 12,
  profileImage: null,
  createdAt: new Date('2026-08-31T00:00:00.000Z'),
  updatedAt: new Date('2026-08-31T00:00:00.000Z'),
}

const identityCases = [
  { name: 'returns the public user for a valid access token', input: { authentication: 'valid', user: USER }, expected: { status: 200, code: undefined, userId: USER.id } },
  { name: 'rejects a missing access token', input: { authentication: 'missing', user: USER }, expected: { status: 401, code: 'MISSING_ACCESS_TOKEN', userId: undefined } },
  { name: 'rejects an access token whose user no longer exists', input: { authentication: 'valid', user: null }, expected: { status: 401, code: 'INVALID_ACCESS_TOKEN', userId: undefined } },
]

describe('identity handler', () => {
  it.each(identityCases)('$name', async ({ input, expected }) => {
    const authenticator: RequestAuthenticator = {
      authenticate: vi.fn(() => input.authentication === 'valid'
        ? Promise.resolve({ userId: USER.id, role: USER.role })
        : Promise.reject(new RequestAuthenticationError('MISSING_ACCESS_TOKEN'))),
    }
    const response = await createIdentityHandler(authenticator, {
      findSafeById: vi.fn(() => Promise.resolve(input.user)),
    })(new Request('http://localhost/api/me'))
    const body = await response.json() as { error?: { code: string }; user?: { id: string } }

    expect({ status: response.status, code: body.error?.code, userId: body.user?.id }).toEqual(expected)
  })
})
