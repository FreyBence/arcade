// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import { createAccessTokenService } from '../accessToken'
import { withAuthentication } from './authenticationMiddleware'
import { createRequestAuthenticator } from './requestAuthenticator'
import { RequestAuthenticationError } from './requestAuthenticationErrors'
import type { RequestIdentity } from './requestAuthenticationTypes'

const accessTokenConfig = {
  secret: 'request-authentication-test-secret-32-bytes',
  lifetimeSeconds: 60,
  issuer: 'mobile-arcade',
  audience: 'mobile-arcade-api',
}

function createMutableClock(initial: string) {
  let current = new Date(initial)
  return {
    clock: { now: () => current },
    set: (value: string) => {
      current = new Date(value)
    },
  }
}

function request(authorization?: string): Request {
  return new Request('http://localhost/api/protected', {
    headers: authorization ? { authorization } : undefined,
  })
}

describe('request authenticator', () => {
  const validAuthenticationCases = [
    {
      name: 'resolves a valid bearer token to the minimum safe identity',
      input: { scheme: 'Bearer', userId: '0198f8f2-8ad8-7000-8000-000000000001', role: 'VIEWER' as const },
      expected: { userId: '0198f8f2-8ad8-7000-8000-000000000001', role: 'VIEWER' },
    },
    {
      name: 'accepts the case-insensitive bearer authentication scheme',
      input: { scheme: 'bearer', userId: '0198f8f2-8ad8-7000-8000-000000000002', role: 'ADMIN' as const },
      expected: { userId: '0198f8f2-8ad8-7000-8000-000000000002', role: 'ADMIN' },
    },
  ]

  it.each(validAuthenticationCases)('$name', async ({ input, expected }) => {
    const { clock } = createMutableClock('2026-08-31T00:00:00.000Z')
    const accessTokens = createAccessTokenService(accessTokenConfig, clock)
    const token = await accessTokens.issue({ userId: input.userId, role: input.role })
    const authenticator = createRequestAuthenticator(accessTokens)

    await expect(authenticator.authenticate(request(`${input.scheme} ${token}`))).resolves.toEqual(expected)
  })

  const rejectedAuthenticationCases = [
    {
      name: 'rejects a missing authorization token consistently',
      input: { kind: 'missing' as const },
      expected: { name: 'RequestAuthenticationError', code: 'MISSING_ACCESS_TOKEN', message: 'Authentication is required.' },
    },
    {
      name: 'rejects a malformed authorization value',
      input: { kind: 'malformed' as const },
      expected: { name: 'RequestAuthenticationError', code: 'INVALID_ACCESS_TOKEN', message: 'Authentication is required.' },
    },
    {
      name: 'rejects an invalid access token',
      input: { kind: 'invalid' as const },
      expected: { name: 'RequestAuthenticationError', code: 'INVALID_ACCESS_TOKEN', message: 'Authentication is required.' },
    },
    {
      name: 'rejects an expired access token',
      input: { kind: 'expired' as const },
      expected: { name: 'RequestAuthenticationError', code: 'INVALID_ACCESS_TOKEN', message: 'Authentication is required.' },
    },
  ]

  it.each(rejectedAuthenticationCases)('$name', async ({ input, expected }) => {
    const mutableClock = createMutableClock('2026-08-31T00:00:00.000Z')
    const accessTokens = createAccessTokenService(accessTokenConfig, mutableClock.clock)
    const validToken = await accessTokens.issue({ userId: '0198f8f2-8ad8-7000-8000-000000000001', role: 'VIEWER' })
    let protectedRequest = request()

    if (input.kind === 'malformed') protectedRequest = request(`Token ${validToken}`)
    if (input.kind === 'invalid') protectedRequest = request('Bearer not-a-jwt')
    if (input.kind === 'expired') {
      mutableClock.set('2026-08-31T00:01:01.000Z')
      protectedRequest = request(`Bearer ${validToken}`)
    }

    const error = await createRequestAuthenticator(accessTokens)
      .authenticate(protectedRequest)
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(RequestAuthenticationError)
    expect({
      name: (error as RequestAuthenticationError).name,
      code: (error as RequestAuthenticationError).code,
      message: (error as RequestAuthenticationError).message,
    }).toEqual(expected)
  })
})

describe('authentication middleware', () => {
  const middlewareCases = [
    {
      name: 'provides authenticated identity to a protected handler',
      input: { outcome: 'authenticated' as const },
      expected: { status: 200, body: { userId: 'user-id', role: 'VIEWER' }, calls: 1 },
    },
    {
      name: 'returns a consistent response for a missing token',
      input: { outcome: 'missing' as const },
      expected: { status: 401, body: { error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' } }, calls: 0 },
    },
    {
      name: 'returns the same response for an invalid token',
      input: { outcome: 'invalid' as const },
      expected: { status: 401, body: { error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' } }, calls: 0 },
    },
  ]

  it.each(middlewareCases)('$name', async ({ input, expected }) => {
    const authenticate = vi.fn(() => {
      if (input.outcome === 'authenticated') return Promise.resolve({ userId: 'user-id', role: 'VIEWER' as const })
      const code = input.outcome === 'missing' ? 'MISSING_ACCESS_TOKEN' : 'INVALID_ACCESS_TOKEN'
      return Promise.reject(new RequestAuthenticationError(code))
    })
    const protectedHandler = vi.fn((_request: Request, identity: RequestIdentity) => {
      return Promise.resolve(Response.json(identity))
    })
    const response = await withAuthentication({ authenticate }, protectedHandler)(request())
    const body = await response.json() as unknown

    expect({ status: response.status, body, calls: protectedHandler.mock.calls.length }).toEqual(expected)
  })
})
