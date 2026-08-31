import { describe, expect, it, vi } from 'vitest'
import type { UserRole } from '../../shared/auth'
import { createRegistrationHandler } from './registrationHandler'
import type { NewUserRecord, SafeUser, UserRepository } from './registrationTypes'

const CREATED_AT = new Date('2026-08-31T00:00:00.000Z')
const UPDATED_AT = new Date('2026-08-31T00:00:00.000Z')

const persistedUser: SafeUser = {
  id: '0198f8f2-8ad8-7000-8000-000000000001',
  name: 'Dino Player',
  email: 'player@example.com',
  role: 'VIEWER',
  dinoCoins: 0,
  profileImage: null,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
}

interface JsonUser {
  id: string
  name: string
  email: string
  role: UserRole
  dinoCoins: number
  profileImage: string | null
  createdAt: string
  updatedAt: string
}

interface SuccessBody {
  user: JsonUser
}

interface ErrorBody {
  error: { code: string; message: string }
}

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function createDependencies(existingUserId: string | null = null) {
  const findIdByEmail = vi.fn((email: string) => {
    void email
    return Promise.resolve(existingUserId)
  })
  const createUser = vi.fn((user: NewUserRecord) => Promise.resolve({ ...persistedUser, name: user.name, email: user.email }))
  const users: UserRepository = {
    findIdByEmail,
    create: createUser,
  }
  const hashPassword = vi.fn((password: string) => Promise.resolve(`argon2-hash-for:${password}`))

  return { dependencies: { users, hashPassword }, findIdByEmail, createUser, hashPassword }
}

const successfulRegistrationCases = [
  {
    name: 'registers a valid visitor with normalized profile data',
    input: { name: '  Dino Player  ', email: '  Player@Example.COM ', password: 'safe-password' },
    expected: {
      status: 201,
      persisted: { name: 'Dino Player', email: 'player@example.com', passwordHash: 'argon2-hash-for:safe-password' },
      user: {
        id: '0198f8f2-8ad8-7000-8000-000000000001',
        name: 'Dino Player',
        email: 'player@example.com',
        role: 'VIEWER',
        dinoCoins: 0,
        profileImage: null,
        createdAt: '2026-08-31T00:00:00.000Z',
        updatedAt: '2026-08-31T00:00:00.000Z',
      },
    },
  },
]

const rejectedRegistrationCases = [
  { name: 'rejects an empty name', input: { name: ' ', email: 'player@example.com', password: 'safe-password' }, expected: { status: 400, code: 'INVALID_REQUEST' } },
  { name: 'rejects an invalid email', input: { name: 'Dino', email: 'not-an-email', password: 'safe-password' }, expected: { status: 400, code: 'INVALID_REQUEST' } },
  { name: 'rejects a short password', input: { name: 'Dino', email: 'player@example.com', password: 'short' }, expected: { status: 400, code: 'INVALID_REQUEST' } },
  { name: 'rejects a client-supplied role', input: { name: 'Dino', email: 'player@example.com', password: 'safe-password', role: 'ADMIN' }, expected: { status: 400, code: 'INVALID_REQUEST' } },
  { name: 'rejects client-supplied Dino Coins', input: { name: 'Dino', email: 'player@example.com', password: 'safe-password', dinoCoins: 1000 }, expected: { status: 400, code: 'INVALID_REQUEST' } },
  { name: 'rejects a client-supplied password hash', input: { name: 'Dino', email: 'player@example.com', password: 'safe-password', passwordHash: 'chosen-hash' }, expected: { status: 400, code: 'INVALID_REQUEST' } },
]

describe('registration API', () => {
  it.each(successfulRegistrationCases)('$name', async ({ input, expected }) => {
    const { createUser, dependencies } = createDependencies()
    const response = await createRegistrationHandler(dependencies)(createRequest(input))
    const body = await response.json() as SuccessBody

    expect(response.status).toBe(expected.status)
    expect(createUser).toHaveBeenCalledWith(expected.persisted)
    expect(body.user).toEqual(expected.user)
    expect(body.user).not.toHaveProperty('password')
    expect(body.user).not.toHaveProperty('passwordHash')
  })

  it.each(rejectedRegistrationCases)('$name', async ({ input, expected }) => {
    const { createUser, dependencies, hashPassword } = createDependencies()
    const response = await createRegistrationHandler(dependencies)(createRequest(input))
    const body = await response.json() as ErrorBody

    expect({ status: response.status, code: body.error.code }).toEqual(expected)
    expect(hashPassword).not.toHaveBeenCalled()
    expect(createUser).not.toHaveBeenCalled()
  })

  const duplicateCases = [
    {
      name: 'rejects an email already owned by another user',
      input: { name: 'Dino', email: 'PLAYER@example.com', password: 'safe-password' },
      expected: { status: 409, code: 'DUPLICATE_EMAIL', lookup: 'player@example.com' },
    },
  ]

  it.each(duplicateCases)('$name', async ({ input, expected }) => {
    const { createUser, dependencies, findIdByEmail, hashPassword } = createDependencies('existing-user-id')
    const response = await createRegistrationHandler(dependencies)(createRequest(input))
    const body = await response.json() as ErrorBody

    expect({ status: response.status, code: body.error.code, lookup: findIdByEmail.mock.calls[0]?.[0] }).toEqual(expected)
    expect(hashPassword).not.toHaveBeenCalled()
    expect(createUser).not.toHaveBeenCalled()
  })

  const malformedRequestCases = [
    {
      name: 'rejects malformed JSON',
      input: '{not-json',
      expected: { status: 400, code: 'INVALID_REQUEST' },
    },
  ]

  it.each(malformedRequestCases)('$name', async ({ input, expected }) => {
    const { dependencies } = createDependencies()
    const request = new Request('http://localhost/api/register', { method: 'POST', body: input })
    const response = await createRegistrationHandler(dependencies)(request)
    const body = await response.json() as ErrorBody

    expect({ status: response.status, code: body.error.code }).toEqual(expected)
  })
})
