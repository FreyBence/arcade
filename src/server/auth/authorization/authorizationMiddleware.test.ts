import { describe, expect, it, vi } from 'vitest'
import type { UserRole } from '../../../shared/auth'
import { RequestAuthenticationError, type RequestIdentity } from '../requestAuthentication'
import { RoleAuthorizationError } from './authorizationErrors'
import { withAuthenticationAndRoles, withRoleAuthorization } from './authorizationMiddleware'
import { requireAnyRole } from './roleAuthorization'

const authorizationCases = [
  {
    name: 'allows an administrator when ADMIN is required',
    input: { identity: { userId: 'admin-id', role: 'ADMIN' as const }, allowedRoles: ['ADMIN'] as const },
    expected: { allowed: true, error: null },
  },
  {
    name: 'rejects a viewer when ADMIN is required',
    input: { identity: { userId: 'viewer-id', role: 'VIEWER' as const }, allowedRoles: ['ADMIN'] as const },
    expected: { allowed: false, error: 'RoleAuthorizationError' },
  },
  {
    name: 'allows a viewer when VIEWER is accepted',
    input: { identity: { userId: 'viewer-id', role: 'VIEWER' as const }, allowedRoles: ['VIEWER'] as const },
    expected: { allowed: true, error: null },
  },
  {
    name: 'allows either registered role when both are accepted',
    input: { identity: { userId: 'admin-id', role: 'ADMIN' as const }, allowedRoles: ['ADMIN', 'VIEWER'] as const },
    expected: { allowed: true, error: null },
  },
  {
    name: 'denies every identity when no roles are accepted',
    input: { identity: { userId: 'admin-id', role: 'ADMIN' as const }, allowedRoles: [] as const },
    expected: { allowed: false, error: 'RoleAuthorizationError' },
  },
]

describe('role authorization', () => {
  it.each(authorizationCases)('$name', ({ input, expected }) => {
    let error: unknown = null
    try {
      requireAnyRole(input.identity, input.allowedRoles)
    } catch (caught) {
      error = caught
    }

    expect({ allowed: error === null, error: error instanceof Error ? error.name : null }).toEqual(expected)
    if (error !== null) expect(error).toBeInstanceOf(RoleAuthorizationError)
  })

  const middlewareCases = [
    {
      name: 'passes an allowed identity to the protected handler',
      input: { identity: { userId: 'admin-id', role: 'ADMIN' as const }, allowedRoles: ['ADMIN'] as const },
      expected: { status: 200, body: { userId: 'admin-id', role: 'ADMIN' }, calls: 1 },
    },
    {
      name: 'returns forbidden without invoking the handler for a denied identity',
      input: { identity: { userId: 'viewer-id', role: 'VIEWER' as const }, allowedRoles: ['ADMIN'] as const },
      expected: { status: 403, body: { error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' } }, calls: 0 },
    },
  ]

  it.each(middlewareCases)('$name', async ({ input, expected }) => {
    const handler = vi.fn((_request: Request, identity: RequestIdentity) => Promise.resolve(Response.json(identity)))
    const protectedHandler = withRoleAuthorization(input.allowedRoles, handler)
    const response = await protectedHandler(new Request('http://localhost/admin'), input.identity)
    const body = await response.json() as unknown

    expect({ status: response.status, body, calls: handler.mock.calls.length }).toEqual(expected)
  })

  const composedMiddlewareCases = [
    {
      name: 'returns unauthenticated before checking roles when identity is missing',
      input: { authentication: 'missing' as const, role: 'VIEWER' as UserRole },
      expected: { status: 401, code: 'UNAUTHENTICATED', calls: 0 },
    },
    {
      name: 'returns forbidden for an authenticated viewer',
      input: { authentication: 'valid' as const, role: 'VIEWER' as UserRole },
      expected: { status: 403, code: 'FORBIDDEN', calls: 0 },
    },
    {
      name: 'allows an authenticated administrator',
      input: { authentication: 'valid' as const, role: 'ADMIN' as UserRole },
      expected: { status: 200, code: null, calls: 1 },
    },
  ]

  it.each(composedMiddlewareCases)('$name', async ({ input, expected }) => {
    const authenticate = vi.fn(() => {
      if (input.authentication === 'missing') {
        return Promise.reject(new RequestAuthenticationError('MISSING_ACCESS_TOKEN'))
      }
      return Promise.resolve({ userId: 'user-id', role: input.role })
    })
    const handler = vi.fn((_request: Request, identity: RequestIdentity) => Promise.resolve(Response.json(identity)))
    const response = await withAuthenticationAndRoles({ authenticate }, ['ADMIN'], handler)(
      new Request('http://localhost/admin'),
    )
    const body = await response.json() as { error?: { code?: string } }

    expect({ status: response.status, code: body.error?.code ?? null, calls: handler.mock.calls.length }).toEqual(expected)
  })
})
