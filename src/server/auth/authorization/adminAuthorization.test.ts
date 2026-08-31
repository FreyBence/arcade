// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import { createAccessTokenService } from '../accessToken'
import { createRequestAuthenticator, type RequestIdentity } from '../requestAuthentication'
import { protectAdminEndpoint } from './adminAuthorization'

const accessTokenConfig = {
  secret: 'admin-endpoint-integration-secret-32-bytes',
  lifetimeSeconds: 300,
  issuer: 'mobile-arcade',
  audience: 'mobile-arcade-api',
}

const adminEndpointCases = [
  {
    name: 'rejects a direct anonymous guest request',
    input: { identity: 'guest' as const },
    expected: {
      status: 401,
      body: { error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' } },
      calls: 0,
    },
  },
  {
    name: 'rejects a direct authenticated viewer request',
    input: { identity: 'viewer' as const },
    expected: {
      status: 403,
      body: { error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' } },
      calls: 0,
    },
  },
  {
    name: 'allows a direct authenticated administrator request',
    input: { identity: 'admin' as const },
    expected: {
      status: 200,
      body: { userId: 'admin-id', role: 'ADMIN' },
      calls: 1,
    },
  },
]

describe('admin endpoint protection', () => {
  it.each(adminEndpointCases)('$name', async ({ input, expected }) => {
    const clock = { now: () => new Date('2026-08-31T00:00:00.000Z') }
    const accessTokens = createAccessTokenService(accessTokenConfig, clock)
    const authenticator = createRequestAuthenticator(accessTokens)
    const managementHandler = vi.fn((_request: Request, identity: RequestIdentity) => {
      return Promise.resolve(Response.json(identity))
    })
    const protectedEndpoint = protectAdminEndpoint(authenticator, managementHandler)
    const headers = new Headers()

    if (input.identity !== 'guest') {
      const role = input.identity === 'admin' ? 'ADMIN' : 'VIEWER'
      const userId = input.identity === 'admin' ? 'admin-id' : 'viewer-id'
      const token = await accessTokens.issue({ userId, role })
      headers.set('authorization', `Bearer ${token}`)
    }

    const response = await protectedEndpoint(new Request('http://localhost/api/admin/direct', { headers }))
    const body = await response.json() as unknown

    expect({ status: response.status, body, calls: managementHandler.mock.calls.length }).toEqual(expected)
  })
})
