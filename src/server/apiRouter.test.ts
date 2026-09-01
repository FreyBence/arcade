import { describe, expect, it, vi } from 'vitest'
import type { ApplicationApi } from './applicationApi'
import { createApiRouter } from './apiRouter'

function createApi(): ApplicationApi {
  const handler = vi.fn((request: Request) => Promise.resolve(Response.json({ path: new URL(request.url).pathname })))
  return { register: handler, login: handler, refresh: handler, logout: handler, identity: handler, updateProfile: handler, changePassword: handler, googleAuthorization: handler, googleCallback: handler, adminUsers: handler }
}

const routeCases = [
  { name: 'routes registration', input: { path: '/api/register', method: 'POST' }, expected: { status: 200, allow: null, code: undefined } },
  { name: 'routes login', input: { path: '/api/login', method: 'POST' }, expected: { status: 200, allow: null, code: undefined } },
  { name: 'routes refresh', input: { path: '/api/refresh', method: 'POST' }, expected: { status: 200, allow: null, code: undefined } },
  { name: 'routes logout', input: { path: '/api/logout', method: 'POST' }, expected: { status: 200, allow: null, code: undefined } },
  { name: 'routes current identity', input: { path: '/api/me', method: 'GET' }, expected: { status: 200, allow: null, code: undefined } },
  { name: 'routes profile updates', input: { path: '/api/profile', method: 'PATCH' }, expected: { status: 200, allow: null, code: undefined } },
  { name: 'routes password changes', input: { path: '/api/password', method: 'PATCH' }, expected: { status: 200, allow: null, code: undefined } },
  { name: 'routes Google authorization', input: { path: '/api/auth/google', method: 'GET' }, expected: { status: 200, allow: null, code: undefined } },
  { name: 'routes Google callback', input: { path: '/api/auth/google/callback', method: 'GET' }, expected: { status: 200, allow: null, code: undefined } },
  { name: 'routes admin user searches', input: { path: '/api/admin/users?q=dino', method: 'GET' }, expected: { status: 200, allow: null, code: undefined } },
  { name: 'rejects an unsupported method', input: { path: '/api/login', method: 'GET' }, expected: { status: 405, allow: 'POST', code: 'METHOD_NOT_ALLOWED' } },
  { name: 'returns JSON for an unknown API route', input: { path: '/api/unknown', method: 'GET' }, expected: { status: 404, allow: null, code: 'NOT_FOUND' } },
]

describe('API router', () => {
  it.each(routeCases)('$name', async ({ input, expected }) => {
    const response = await createApiRouter(createApi())(new Request(`http://localhost${input.path}`, { method: input.method }))
    const body = await response.json() as { error?: { code?: string } }
    expect({ status: response.status, allow: response.headers.get('allow'), code: body.error?.code }).toEqual(expected)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  const failureCases = [
    { name: 'hides unexpected handler failures', input: new Error('database details'), expected: { status: 500, code: 'INTERNAL_SERVER_ERROR' } },
  ]

  it.each(failureCases)('$name', async ({ input, expected }) => {
    const api = createApi()
    api.login = vi.fn(() => Promise.reject(input))
    const response = await createApiRouter(api)(new Request('http://localhost/api/login', { method: 'POST' }))
    const body = await response.json() as { error: { code: string; message: string } }
    expect({ status: response.status, code: body.error.code }).toEqual(expected)
    expect(body.error.message).not.toContain(input.message)
  })
})
