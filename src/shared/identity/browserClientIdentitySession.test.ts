import { describe, expect, it, vi } from 'vitest'
import { ClientIdentitySessionError, createBrowserClientIdentitySession } from './browserClientIdentitySession'
import { getAccessToken, setAccessToken } from './accessTokenStore'

const USER = { id: 'user-id', name: 'Dino Player', email: 'player@example.com', role: 'VIEWER', dinoCoins: 12 } as const

const restoreCases = [
  { name: 'restores a user from a valid refresh session', input: { refresh: 200, identity: 200, accessToken: 'renewed-token', user: USER }, expected: { user: USER, token: 'renewed-token', paths: ['/api/refresh', '/api/me'] } },
  { name: 'returns guest for an expired refresh session', input: { refresh: 401, identity: 200, accessToken: undefined, user: USER }, expected: { user: null, token: null, paths: ['/api/refresh'] } },
  { name: 'returns guest when the refreshed identity is invalid', input: { refresh: 200, identity: 401, accessToken: 'renewed-token', user: undefined }, expected: { user: null, token: null, paths: ['/api/refresh', '/api/me'] } },
]

const logoutCases = [
  {
    name: 'posts to the logout endpoint',
    input: { status: 200 },
    expected: { error: undefined, request: { path: '/api/logout', method: 'POST' } },
  },
  {
    name: 'reports a failed server logout',
    input: { status: 503 },
    expected: { error: ClientIdentitySessionError, request: { path: '/api/logout', method: 'POST' } },
  },
]

describe('browser client identity session', () => {
  it.each(restoreCases)('$name', async ({ input, expected }) => {
    setAccessToken('stale-token')
    const paths: string[] = []
    const fetcher: typeof fetch = vi.fn((request: RequestInfo | URL) => {
      const path = typeof request === 'string' ? request : request instanceof URL ? request.href : request.url
      paths.push(path)
      if (path === '/api/refresh') return Promise.resolve(Response.json({ accessToken: input.accessToken }, { status: input.refresh }))
      return Promise.resolve(Response.json({ user: input.user }, { status: input.identity }))
    })

    await expect(createBrowserClientIdentitySession(fetcher).restore()).resolves.toEqual(expected.user)
    expect({ token: getAccessToken(), paths }).toEqual({ token: expected.token, paths: expected.paths })
  })

  it.each(logoutCases)('$name', async ({ input, expected }) => {
    setAccessToken('active-token')
    let request: { path: string; method: string | undefined } | undefined
    const fetcher: typeof fetch = vi.fn((path: string | URL | Request, init?: RequestInit) => {
      request = {
        path: typeof path === 'string' ? path : path instanceof URL ? path.href : path.url,
        method: init?.method,
      }
      return Promise.resolve(new Response(null, { status: input.status }))
    })
    const result = createBrowserClientIdentitySession(fetcher).logout()

    if (expected.error) await expect(result).rejects.toBeInstanceOf(expected.error)
    else await expect(result).resolves.toBeUndefined()
    expect(request).toEqual(expected.request)
    expect(getAccessToken()).toBe(expected.error ? 'active-token' : null)
  })
})
