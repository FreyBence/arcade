import { describe, expect, it, vi } from 'vitest'
import { ClientIdentitySessionError, createBrowserClientIdentitySession } from './browserClientIdentitySession'

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
  it.each(logoutCases)('$name', async ({ input, expected }) => {
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
  })
})
