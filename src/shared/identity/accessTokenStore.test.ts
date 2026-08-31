import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAuthenticatedFetch, getAccessToken, setAccessToken } from './accessTokenStore'

afterEach(() => setAccessToken(null))

const fetchCases = [
  { name: 'adds the active bearer token', input: { token: 'short-lived-token', authorization: undefined }, expected: 'Bearer short-lived-token' },
  { name: 'does not add authorization while signed out', input: { token: null, authorization: undefined }, expected: null },
  { name: 'replaces a caller-provided authorization value', input: { token: 'active-token', authorization: 'Basic old' }, expected: 'Bearer active-token' },
]

describe('authenticated fetch', () => {
  it.each(fetchCases)('$name', async ({ input, expected }) => {
    setAccessToken(input.token)
    let authorization: string | null = null
    const fetcher: typeof fetch = vi.fn((_request: RequestInfo | URL, init?: RequestInit) => {
      authorization = new Headers(init?.headers).get('authorization')
      return Promise.resolve(new Response())
    })

    await createAuthenticatedFetch(fetcher)('/api/protected', {
      headers: input.authorization ? { authorization: input.authorization } : undefined,
    })

    expect(authorization).toBe(expected)
    expect(getAccessToken()).toBe(input.token)
  })
})
