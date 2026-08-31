import { describe, expect, it, vi } from 'vitest'
import type { SafeUser } from './registrationTypes'
import { createLoginHandler } from './loginHandler'
import type { CredentialUser } from './loginTypes'

const safeUser: SafeUser = {
  id: '0198f8f2-8ad8-7000-8000-000000000001',
  name: 'Dino Player',
  email: 'player@example.com',
  role: 'VIEWER',
  dinoCoins: 0,
  createdAt: new Date('2026-08-31T00:00:00.000Z'),
  updatedAt: new Date('2026-08-31T00:00:00.000Z'),
}

const credentialUser: CredentialUser = {
  ...safeUser,
  passwordHash: '$argon2id$stored-password-hash',
}

interface SuccessBody {
  user: Record<string, unknown>
  accessToken: string
}

interface ErrorBody {
  error: { code: string; message: string }
}

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function createDependencies(user: CredentialUser | null, passwordMatches: boolean) {
  const findForAuthentication = vi.fn((email: string) => {
    void email
    return Promise.resolve(user)
  })
  const verifyPassword = vi.fn((password: string, passwordHash: string) => {
    void password
    void passwordHash
    return Promise.resolve(passwordMatches)
  })
  const startSession = vi.fn((authenticatedUser: SafeUser) => {
    void authenticatedUser
    return Promise.resolve({ accessToken: 'short-lived-access-token', refreshCookie: '__Host-arcade_refresh=opaque; HttpOnly; Secure' })
  })

  return {
    dependencies: { users: { findForAuthentication }, verifyPassword, startSession },
    findForAuthentication,
    startSession,
    verifyPassword,
  }
}

const successfulLoginCases = [
  {
    name: 'authenticates valid credentials and starts a session',
    input: { email: ' Player@Example.COM ', password: 'correct-password' },
    expected: {
      status: 200,
      accessToken: 'short-lived-access-token',
      refreshCookie: '__Host-arcade_refresh=opaque; HttpOnly; Secure',
      lookup: 'player@example.com',
      verification: ['correct-password', '$argon2id$stored-password-hash'],
      user: {
        id: '0198f8f2-8ad8-7000-8000-000000000001',
        name: 'Dino Player',
        email: 'player@example.com',
        role: 'VIEWER',
        dinoCoins: 0,
        createdAt: '2026-08-31T00:00:00.000Z',
        updatedAt: '2026-08-31T00:00:00.000Z',
      },
    },
  },
]

const invalidCredentialCases = [
  {
    name: 'rejects an unknown email with the generic authentication error',
    input: { email: 'unknown@example.com', password: 'candidate-password', user: null, matches: false },
    expected: { status: 401, code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.', verifiesWithArgon2Hash: true },
  },
  {
    name: 'rejects an incorrect password with the same authentication error',
    input: { email: 'player@example.com', password: 'incorrect-password', user: credentialUser, matches: false },
    expected: { status: 401, code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.', verifiesWithArgon2Hash: true },
  },
]

const invalidRequestCases = [
  { name: 'rejects a malformed email', input: { email: 'invalid', password: 'password' }, expected: { status: 400, code: 'INVALID_REQUEST' } },
  { name: 'rejects an empty password', input: { email: 'player@example.com', password: '' }, expected: { status: 400, code: 'INVALID_REQUEST' } },
  { name: 'rejects unexpected request properties', input: { email: 'player@example.com', password: 'password', role: 'ADMIN' }, expected: { status: 400, code: 'INVALID_REQUEST' } },
]

describe('login API', () => {
  it.each(successfulLoginCases)('$name', async ({ input, expected }) => {
    const { dependencies, findForAuthentication, startSession, verifyPassword } = createDependencies(credentialUser, true)
    const response = await createLoginHandler(dependencies)(createRequest(input))
    const body = await response.json() as SuccessBody

    expect(response.status).toBe(expected.status)
    expect(response.headers.get('set-cookie')).toBe(expected.refreshCookie)
    expect(findForAuthentication.mock.calls[0]?.[0]).toBe(expected.lookup)
    expect(verifyPassword.mock.calls[0]).toEqual(expected.verification)
    expect(startSession).toHaveBeenCalledWith(safeUser)
    expect(body.user).toEqual(expected.user)
    expect(body.accessToken).toBe(expected.accessToken)
    expect(body.user).not.toHaveProperty('passwordHash')
  })

  it.each(invalidCredentialCases)('$name', async ({ input, expected }) => {
    const { dependencies, startSession, verifyPassword } = createDependencies(input.user, input.matches)
    const response = await createLoginHandler(dependencies)(createRequest({ email: input.email, password: input.password }))
    const body = await response.json() as ErrorBody
    const verifiedHash = verifyPassword.mock.calls[0]?.[1]

    expect({
      status: response.status,
      code: body.error.code,
      message: body.error.message,
      verifiesWithArgon2Hash: verifiedHash?.startsWith('$argon2id$') ?? false,
    }).toEqual(expected)
    expect(startSession).not.toHaveBeenCalled()
  })

  it.each(invalidRequestCases)('$name', async ({ input, expected }) => {
    const { dependencies, findForAuthentication, startSession, verifyPassword } = createDependencies(credentialUser, true)
    const response = await createLoginHandler(dependencies)(createRequest(input))
    const body = await response.json() as ErrorBody

    expect({ status: response.status, code: body.error.code }).toEqual(expected)
    expect(findForAuthentication).not.toHaveBeenCalled()
    expect(verifyPassword).not.toHaveBeenCalled()
    expect(startSession).not.toHaveBeenCalled()
  })

  const malformedJsonCases = [
    { name: 'rejects malformed JSON', input: '{not-json', expected: { status: 400, code: 'INVALID_REQUEST' } },
  ]

  it.each(malformedJsonCases)('$name', async ({ input, expected }) => {
    const { dependencies } = createDependencies(credentialUser, true)
    const request = new Request('http://localhost/api/login', { method: 'POST', body: input })
    const response = await createLoginHandler(dependencies)(request)
    const body = await response.json() as ErrorBody

    expect({ status: response.status, code: body.error.code }).toEqual(expected)
  })
})
