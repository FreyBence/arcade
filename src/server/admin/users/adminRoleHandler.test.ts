import { describe, expect, it, vi } from 'vitest'
import type { UserRole } from '../../../shared/auth'
import { RequestAuthenticationError, type RequestAuthenticator } from '../../auth/requestAuthentication'
import { createAdminRoleHandler } from './adminRoleHandler'

const updatedUser = { id: 'user-1', name: 'Dino', email: 'dino@example.com', role: 'ADMIN' as const, dinoCoins: 0, profileImage: null }
const cases = [
  { name: 'promotes a viewer', input: { authenticated: true, actor: 'ADMIN' as UserRole, body: { userId: 'user-1', role: 'ADMIN' }, result: { status: 'updated' as const, user: updatedUser } }, expected: { status: 200, code: undefined, update: ['user-1', 'ADMIN'] } },
  { name: 'demotes an administrator', input: { authenticated: true, actor: 'ADMIN' as UserRole, body: { userId: 'user-1', role: 'VIEWER' }, result: { status: 'updated' as const, user: { ...updatedUser, role: 'VIEWER' as const } } }, expected: { status: 200, code: undefined, update: ['user-1', 'VIEWER'] } },
  { name: 'protects the last administrator', input: { authenticated: true, actor: 'ADMIN' as UserRole, body: { userId: 'user-1', role: 'VIEWER' }, result: { status: 'last-admin' as const } }, expected: { status: 409, code: 'LAST_ADMIN', update: ['user-1', 'VIEWER'] } },
  { name: 'rejects the guest role', input: { authenticated: true, actor: 'ADMIN' as UserRole, body: { userId: 'user-1', role: 'guest' }, result: { status: 'not-found' as const } }, expected: { status: 400, code: 'INVALID_USER_ROLE', update: undefined } },
  { name: 'prevents viewers from changing roles', input: { authenticated: true, actor: 'VIEWER' as UserRole, body: { userId: 'user-1', role: 'ADMIN' }, result: { status: 'updated' as const, user: updatedUser } }, expected: { status: 403, code: 'FORBIDDEN', update: undefined } },
  { name: 'requires authentication', input: { authenticated: false, actor: 'ADMIN' as UserRole, body: { userId: 'user-1', role: 'ADMIN' }, result: { status: 'updated' as const, user: updatedUser } }, expected: { status: 401, code: 'UNAUTHENTICATED', update: undefined } },
]

describe('admin role handler', () => {
  it.each(cases)('$name', async ({ input, expected }) => {
    const authenticator: RequestAuthenticator = { authenticate: input.authenticated ? vi.fn().mockResolvedValue({ userId: 'actor', role: input.actor }) : vi.fn().mockRejectedValue(new RequestAuthenticationError('MISSING_ACCESS_TOKEN')) }
    const updates: string[][] = []
    const setRole = vi.fn((userId: string, role: UserRole) => { updates.push([userId, role]); return Promise.resolve(input.result) })
    const response = await createAdminRoleHandler(authenticator, { setRole })(new Request('http://localhost/api/admin/users/role', { method: 'PATCH', headers: { authorization: 'Bearer token', 'content-type': 'application/json' }, body: JSON.stringify(input.body) }))
    const body = await response.json() as { error?: { code: string } }
    expect({ status: response.status, code: body.error?.code, update: updates[0] }).toEqual(expected)
  })
})
