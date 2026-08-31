// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import type { AuthenticationSession, AuthenticationSessionRepository, NewAuthenticationSession, RefreshableAuthenticationSession } from '../session'
import { readRefreshConfig, type RefreshConfig } from './refreshConfig'
import { createLogoutHandler } from './logoutHandler'
import { createRefreshHandler } from './refreshHandler'
import { InvalidRefreshSessionError } from './refreshErrors'
import { createRefreshService } from './refreshService'

const NOW = new Date('2026-08-31T00:00:00.000Z')
const YEAR_IN_SECONDS = 31_536_000
const config: RefreshConfig = { lifetimeSeconds: YEAR_IN_SECONDS, cookieName: '__Host-arcade_refresh' }

function createSessionRepository(session: RefreshableAuthenticationSession | null = null) {
  const create = vi.fn((input: NewAuthenticationSession) => {
    void input
    return Promise.resolve({
      id: '0198f8f2-8ad8-7000-8000-000000000010',
      userId: '0198f8f2-8ad8-7000-8000-000000000001',
      expiresAt: new Date('2027-08-31T00:00:00.000Z'),
      revokedAt: null,
      createdAt: NOW,
    } satisfies AuthenticationSession)
  })
  const findByRefreshTokenHash = vi.fn((refreshTokenHash: string) => {
    void refreshTokenHash
    return Promise.resolve(session)
  })
  const revoke = vi.fn((id: string, revokedAt: Date) => {
    void id
    return Promise.resolve({
      id: '0198f8f2-8ad8-7000-8000-000000000010',
      userId: '0198f8f2-8ad8-7000-8000-000000000001',
      expiresAt: new Date('2027-08-31T00:00:00.000Z'),
      revokedAt,
      createdAt: NOW,
    })
  })
  const repository: AuthenticationSessionRepository = { create, findByRefreshTokenHash, revoke }
  return { create, findByRefreshTokenHash, repository }
}

function refreshableSession(overrides: Partial<RefreshableAuthenticationSession> = {}): RefreshableAuthenticationSession {
  return {
    id: '0198f8f2-8ad8-7000-8000-000000000010',
    userId: '0198f8f2-8ad8-7000-8000-000000000001',
    userRole: 'VIEWER',
    expiresAt: new Date('2027-08-31T00:00:00.000Z'),
    revokedAt: null,
    createdAt: NOW,
    ...overrides,
  }
}

const configurationCases = [
  {
    name: 'supports an approximately one-year refresh lifetime',
    input: { REFRESH_TOKEN_TTL_SECONDS: '31536000', REFRESH_TOKEN_COOKIE_NAME: '__Host-arcade_refresh' },
    expected: { lifetimeSeconds: YEAR_IN_SECONDS, cookieName: '__Host-arcade_refresh' },
  },
]

const invalidConfigurationCases = [
  { name: 'rejects a missing refresh lifetime', input: { REFRESH_TOKEN_COOKIE_NAME: '__Host-arcade_refresh' }, expected: 'REFRESH_TOKEN_TTL_SECONDS must be an integer between 1 and 31622400.' },
  { name: 'rejects a lifetime beyond approximately one year', input: { REFRESH_TOKEN_TTL_SECONDS: '31622401', REFRESH_TOKEN_COOKIE_NAME: '__Host-arcade_refresh' }, expected: 'REFRESH_TOKEN_TTL_SECONDS must be an integer between 1 and 31622400.' },
  { name: 'rejects a cookie without the secure host prefix', input: { REFRESH_TOKEN_TTL_SECONDS: '31536000', REFRESH_TOKEN_COOKIE_NAME: 'refresh' }, expected: 'REFRESH_TOKEN_COOKIE_NAME must use a valid __Host- cookie name.' },
]

describe('refresh configuration', () => {
  it.each(configurationCases)('$name', ({ input, expected }) => {
    expect(readRefreshConfig(input)).toEqual(expected)
  })

  it.each(invalidConfigurationCases)('$name', ({ input, expected }) => {
    expect(() => readRefreshConfig(input)).toThrow(expected)
  })
})

describe('refresh service', () => {
  const startCases = [
    {
      name: 'establishes a persistent session and secure refresh cookie',
      input: {
        user: {
          id: '0198f8f2-8ad8-7000-8000-000000000001',
          name: 'Dino Player',
          email: 'player@example.com',
          role: 'VIEWER' as const,
          dinoCoins: 0,
          profileImage: null,
          createdAt: NOW,
          updatedAt: NOW,
        },
        refreshToken: 'refresh-secret',
      },
      expected: {
        stored: {
          userId: '0198f8f2-8ad8-7000-8000-000000000001',
          refreshTokenHash: '8a1914992d43ca2225bb7ea93ab149b4c455750da5bf8e987f391b935a11722b',
          expiresAt: new Date('2027-08-31T00:00:00.000Z'),
        },
        identity: { userId: '0198f8f2-8ad8-7000-8000-000000000001', role: 'VIEWER' },
        result: {
          accessToken: 'new-access-token',
          refreshCookie: '__Host-arcade_refresh=refresh-secret; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Strict',
        },
      },
    },
  ]

  it.each(startCases)('$name', async ({ input, expected }) => {
    const { create, repository } = createSessionRepository()
    const issue = vi.fn(() => Promise.resolve('new-access-token'))
    const service = createRefreshService(config, repository, { issue }, { now: () => NOW }, () => input.refreshToken)

    await expect(service.start(input.user)).resolves.toEqual(expected.result)
    expect(create).toHaveBeenCalledWith(expected.stored)
    expect(create.mock.calls[0]?.[0]).not.toHaveProperty('refreshToken')
    expect(issue).toHaveBeenCalledWith(expected.identity)
  })

  const successfulRefreshCases = [
    {
      name: 'issues a new access token for an active session',
      input: { refreshToken: 'refresh-secret', session: refreshableSession() },
      expected: {
        lookupHash: '8a1914992d43ca2225bb7ea93ab149b4c455750da5bf8e987f391b935a11722b',
        identity: { userId: '0198f8f2-8ad8-7000-8000-000000000001', role: 'VIEWER' },
        accessToken: 'renewed-access-token',
      },
    },
  ]

  it.each(successfulRefreshCases)('$name', async ({ input, expected }) => {
    const { findByRefreshTokenHash, repository } = createSessionRepository(input.session)
    const issue = vi.fn(() => Promise.resolve(expected.accessToken))
    const service = createRefreshService(config, repository, { issue }, { now: () => NOW })

    await expect(service.refresh(input.refreshToken)).resolves.toBe(expected.accessToken)
    expect(findByRefreshTokenHash).toHaveBeenCalledWith(expected.lookupHash)
    expect(issue).toHaveBeenCalledWith(expected.identity)
  })

  const rejectedRefreshCases = [
    { name: 'rejects an unknown refresh credential', input: null, expected: 'InvalidRefreshSessionError' },
    { name: 'rejects an expired session', input: refreshableSession({ expiresAt: new Date('2026-08-30T00:00:00.000Z') }), expected: 'InvalidRefreshSessionError' },
    { name: 'rejects a revoked session', input: refreshableSession({ revokedAt: new Date('2026-08-30T00:00:00.000Z') }), expected: 'InvalidRefreshSessionError' },
  ]

  it.each(rejectedRefreshCases)('$name', async ({ input, expected }) => {
    const { repository } = createSessionRepository(input)
    const issue = vi.fn(() => Promise.resolve('must-not-be-issued'))
    const service = createRefreshService(config, repository, { issue }, { now: () => NOW })
    const error = await service.refresh('refresh-secret').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(InvalidRefreshSessionError)
    expect((error as Error).name).toBe(expected)
    expect(issue).not.toHaveBeenCalled()
  })

  const logoutCases = [
    {
      name: 'revokes only the session represented by the current refresh credential',
      input: refreshableSession(),
      expected: { revokeCount: 1, id: '0198f8f2-8ad8-7000-8000-000000000010', revokedAt: NOW },
    },
    {
      name: 'safely repeats logout for an already revoked session',
      input: refreshableSession({ revokedAt: new Date('2026-08-30T00:00:00.000Z') }),
      expected: { revokeCount: 0, id: null, revokedAt: null },
    },
    {
      name: 'safely logs out an unknown refresh credential',
      input: null,
      expected: { revokeCount: 0, id: null, revokedAt: null },
    },
  ]

  it.each(logoutCases)('$name', async ({ input, expected }) => {
    const { repository } = createSessionRepository(input)
    const revoke = vi.fn((id: string, revokedAt: Date) => {
      void id
      return Promise.resolve({ ...refreshableSession(), revokedAt })
    })
    repository.revoke = revoke
    const service = createRefreshService(config, repository, { issue: vi.fn() }, { now: () => NOW })

    await expect(service.logout('refresh-secret')).resolves.toBeUndefined()
    expect({
      revokeCount: revoke.mock.calls.length,
      id: revoke.mock.calls[0]?.[0] ?? null,
      revokedAt: revoke.mock.calls[0]?.[1] ?? null,
    }).toEqual(expected)
  })

  const revokedRefreshCases = [
    {
      name: 'cannot renew access after the same session is logged out',
      input: { refreshToken: 'refresh-secret' },
      expected: 'InvalidRefreshSessionError',
    },
  ]

  it.each(revokedRefreshCases)('$name', async ({ input, expected }) => {
    let session = refreshableSession()
    const repository: AuthenticationSessionRepository = {
      create: vi.fn(),
      findByRefreshTokenHash: vi.fn(() => Promise.resolve(session)),
      revoke: vi.fn((id: string, revokedAt: Date) => {
        session = { ...session, id, revokedAt }
        return Promise.resolve(session)
      }),
    }
    const issue = vi.fn(() => Promise.resolve('must-not-be-issued'))
    const service = createRefreshService(config, repository, { issue }, { now: () => NOW })

    await service.logout(input.refreshToken)
    const error = await service.refresh(input.refreshToken).catch((caught: unknown) => caught)

    expect((error as Error).name).toBe(expected)
    expect(issue).not.toHaveBeenCalled()
  })
})

describe('refresh API', () => {
  const handlerCases = [
    {
      name: 'renews access from the secure refresh cookie',
      input: { cookie: '__Host-arcade_refresh=refresh-secret; theme=dark', result: 'renewed-access-token' },
      expected: { status: 200, body: { accessToken: 'renewed-access-token' }, credential: 'refresh-secret' },
    },
    {
      name: 'rejects a request without the refresh cookie',
      input: { cookie: 'theme=dark', result: 'renewed-access-token' },
      expected: { status: 401, body: { error: { code: 'INVALID_REFRESH_SESSION', message: 'Refresh session is invalid or expired.' } }, credential: null },
    },
  ]

  it.each(handlerCases)('$name', async ({ input, expected }) => {
    const refresh = vi.fn((credential: string) => {
      void credential
      return Promise.resolve(input.result)
    })
    const handler = createRefreshHandler(config, { refresh })
    const response = await handler(new Request('http://localhost/api/refresh', { method: 'POST', headers: { cookie: input.cookie } }))
    const body = await response.json() as unknown

    expect({ status: response.status, body, credential: refresh.mock.calls[0]?.[0] ?? null }).toEqual(expected)
  })
})

describe('logout API', () => {
  const logoutHandlerCases = [
    {
      name: 'revokes the current cookie and returns guest identity',
      input: { cookie: '__Host-arcade_refresh=refresh-secret; theme=dark' },
      expected: { status: 200, body: { identity: 'guest' }, credential: 'refresh-secret' },
    },
    {
      name: 'clears the cookie when logout is repeated without a credential',
      input: { cookie: 'theme=dark' },
      expected: { status: 200, body: { identity: 'guest' }, credential: null },
    },
  ]

  it.each(logoutHandlerCases)('$name', async ({ input, expected }) => {
    const logout = vi.fn((credential: string) => {
      void credential
      return Promise.resolve()
    })
    const handler = createLogoutHandler(config, { logout })
    const response = await handler(new Request('http://localhost/api/logout', { method: 'POST', headers: { cookie: input.cookie } }))
    const body = await response.json() as unknown

    expect({ status: response.status, body, credential: logout.mock.calls[0]?.[0] ?? null }).toEqual(expected)
    expect(response.headers.get('set-cookie')).toBe('__Host-arcade_refresh=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; Secure; SameSite=Strict')
  })
})
