import { describe, expect, it, vi } from 'vitest'
import { RequestAuthenticationError, type RequestAuthenticator } from '../../auth/requestAuthentication'
import { createAdminDinoCoinsHandler } from './adminDinoCoinsHandler'

const updatedUser = { id: 'user-1', name: 'Dino Player', email: 'dino@example.com', role: 'VIEWER' as const, dinoCoins: 250, profileImage: null }
const cases = [
  { name: 'allows an administrator to set a user balance', input: { authenticated: true, role: 'ADMIN' as const, body: { userId: 'user-1', dinoCoins: 250 }, found: true }, expected: { status: 200, code: undefined, update: ['user-1', 250], balance: 250 } },
  { name: 'prevents a viewer from setting a user balance', input: { authenticated: true, role: 'VIEWER' as const, body: { userId: 'user-1', dinoCoins: 250 }, found: true }, expected: { status: 403, code: 'FORBIDDEN', update: undefined, balance: undefined } },
  { name: 'requires authentication to set a user balance', input: { authenticated: false, role: 'ADMIN' as const, body: { userId: 'user-1', dinoCoins: 250 }, found: true }, expected: { status: 401, code: 'UNAUTHENTICATED', update: undefined, balance: undefined } },
  { name: 'rejects an invalid balance server-side', input: { authenticated: true, role: 'ADMIN' as const, body: { userId: 'user-1', dinoCoins: -1 }, found: true }, expected: { status: 400, code: 'INVALID_DINO_COIN_BALANCE', update: undefined, balance: undefined } },
  { name: 'returns not found for a missing target user', input: { authenticated: true, role: 'ADMIN' as const, body: { userId: 'missing', dinoCoins: 250 }, found: false }, expected: { status: 404, code: 'USER_NOT_FOUND', update: ['missing', 250], balance: undefined } },
]

describe('admin Dino Coin handler', () => {
  it.each(cases)('$name', async ({ input, expected }) => {
    const authenticate = input.authenticated ? vi.fn().mockResolvedValue({ userId: 'admin', role: input.role }) : vi.fn().mockRejectedValue(new RequestAuthenticationError('INVALID_ACCESS_TOKEN'))
    const authenticator: RequestAuthenticator = { authenticate }
    const updates: [string, number][] = []
    const setDinoCoins = vi.fn((userId: string, balance: number) => { updates.push([userId, balance]); return Promise.resolve(input.found ? { ...updatedUser, dinoCoins: balance } : null) })
    const handler = createAdminDinoCoinsHandler(authenticator, { search: vi.fn(), setDinoCoins })
    const response = await handler(new Request('http://localhost/api/admin/users/dino-coins', { method: 'PATCH', headers: { authorization: 'Bearer token', 'content-type': 'application/json' }, body: JSON.stringify(input.body) }))
    const body = await response.json() as { user?: typeof updatedUser; error?: { code: string } }
    expect({ status: response.status, code: body.error?.code, update: updates[0], balance: body.user?.dinoCoins }).toEqual(expected)
  })
})
