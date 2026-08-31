import { describe, expect, it, vi } from 'vitest'
import type { RequestAuthenticator } from '../auth/requestAuthentication'
import { DuplicateEmailError } from '../auth/registrationErrors'
import type { SafeUser } from '../auth/registrationTypes'
import { createProfileHandler } from './profileHandler'

const user: SafeUser = { id: 'current-user', name: 'New Name', email: 'new@example.com', role: 'VIEWER', dinoCoins: 12, createdAt: new Date(0), updatedAt: new Date(1) }
const updateCases = [
  { name: 'updates only the authenticated user', input: { body: { name: 'New Name', email: 'NEW@example.com' }, result: user }, expected: { status: 200, code: undefined, update: ['current-user', { name: 'New Name', email: 'new@example.com' }] } },
  { name: 'reports duplicate email addresses', input: { body: { name: 'New Name', email: 'used@example.com' }, result: new DuplicateEmailError() }, expected: { status: 409, code: 'DUPLICATE_EMAIL', update: ['current-user', { name: 'New Name', email: 'used@example.com' }] } },
]

describe('profile update handler', () => {
  it.each(updateCases)('$name', async ({ input, expected }) => {
    const authenticator: RequestAuthenticator = { authenticate: vi.fn().mockResolvedValue({ userId: 'current-user', role: 'VIEWER' }) }
    const updateProfile = vi.fn().mockImplementation(() => input.result instanceof Error ? Promise.reject(input.result) : Promise.resolve(input.result))
    const response = await createProfileHandler(authenticator, { updateProfile })(new Request('http://localhost/api/profile', { method: 'PATCH', headers: { authorization: 'Bearer token', 'content-type': 'application/json' }, body: JSON.stringify(input.body) }))
    const body = await response.json() as { error?: { code: string } }
    expect({ status: response.status, code: body.error?.code, update: updateProfile.mock.calls[0] }).toEqual(expected)
  })
})
