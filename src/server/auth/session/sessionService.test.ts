import { describe, expect, it, vi } from 'vitest'
import { hashRefreshToken } from './refreshTokenHash'
import { revokeAuthenticationSession, startAuthenticationSession } from './sessionService'
import { getAuthenticationSessionState } from './sessionState'
import type { AuthenticationSession, AuthenticationSessionRepository, NewAuthenticationSession } from './sessionTypes'

const persistedSession: AuthenticationSession = {
  id: '0198f8f2-8ad8-7000-8000-000000000010',
  userId: '0198f8f2-8ad8-7000-8000-000000000001',
  expiresAt: new Date('2027-08-31T00:00:00.000Z'),
  revokedAt: null,
  createdAt: new Date('2026-08-31T00:00:00.000Z'),
}

function createRepository() {
  const create = vi.fn((session: NewAuthenticationSession) => {
    void session
    return Promise.resolve(persistedSession)
  })
  const findByRefreshTokenHash = vi.fn((refreshTokenHash: string) => {
    void refreshTokenHash
    return Promise.resolve(null)
  })
  const revoke = vi.fn((id: string, revokedAt: Date) => {
    void id
    return Promise.resolve({ ...persistedSession, revokedAt })
  })
  const repository: AuthenticationSessionRepository = { create, findByRefreshTokenHash, revoke }

  return { create, repository, revoke }
}

const refreshTokenHashCases = [
  {
    name: 'hashes an opaque refresh credential using SHA-256',
    input: 'refresh-secret',
    expected: '8a1914992d43ca2225bb7ea93ab149b4c455750da5bf8e987f391b935a11722b',
  },
  {
    name: 'hashes a Unicode refresh credential as UTF-8',
    input: 'dino-🦕',
    expected: '314109777fe7d6c467d1a684ca6d44716de3de8be061afa1751dddca3345472a',
  },
]

const sessionStateCases = [
  {
    name: 'identifies a usable session as active',
    input: { expiresAt: new Date('2027-01-01T00:00:00.000Z'), revokedAt: null, now: new Date('2026-08-31T00:00:00.000Z') },
    expected: 'active',
  },
  {
    name: 'identifies a past session as expired',
    input: { expiresAt: new Date('2026-08-30T00:00:00.000Z'), revokedAt: null, now: new Date('2026-08-31T00:00:00.000Z') },
    expected: 'expired',
  },
  {
    name: 'treats a session as expired at its exact expiration time',
    input: { expiresAt: new Date('2026-08-31T00:00:00.000Z'), revokedAt: null, now: new Date('2026-08-31T00:00:00.000Z') },
    expected: 'expired',
  },
  {
    name: 'identifies a revoked session even before expiration',
    input: { expiresAt: new Date('2027-01-01T00:00:00.000Z'), revokedAt: new Date('2026-08-30T00:00:00.000Z'), now: new Date('2026-08-31T00:00:00.000Z') },
    expected: 'revoked',
  },
] as const

describe('authentication sessions', () => {
  it.each(refreshTokenHashCases)('$name', ({ input, expected }) => {
    expect(hashRefreshToken(input)).toBe(expected)
  })

  it.each(sessionStateCases)('$name', ({ input, expected }) => {
    expect(getAuthenticationSessionState(input, input.now)).toBe(expected)
  })

  const creationCases = [
    {
      name: 'persists only the refresh-token hash',
      input: {
        userId: '0198f8f2-8ad8-7000-8000-000000000001',
        refreshToken: 'refresh-secret',
        expiresAt: new Date('2027-08-31T00:00:00.000Z'),
      },
      expected: {
        userId: '0198f8f2-8ad8-7000-8000-000000000001',
        refreshTokenHash: '8a1914992d43ca2225bb7ea93ab149b4c455750da5bf8e987f391b935a11722b',
        expiresAt: new Date('2027-08-31T00:00:00.000Z'),
      },
    },
  ]

  it.each(creationCases)('$name', async ({ input, expected }) => {
    const { create, repository } = createRepository()
    const session = await startAuthenticationSession(input, repository)

    expect(create).toHaveBeenCalledWith(expected)
    expect(create.mock.calls[0]?.[0]).not.toHaveProperty('refreshToken')
    expect(session).toEqual(persistedSession)
    expect(session).not.toHaveProperty('refreshTokenHash')
  })

  const revocationCases = [
    {
      name: 'records when a session was revoked',
      input: { id: '0198f8f2-8ad8-7000-8000-000000000010', revokedAt: new Date('2026-09-01T00:00:00.000Z') },
      expected: { id: '0198f8f2-8ad8-7000-8000-000000000010', revokedAt: new Date('2026-09-01T00:00:00.000Z') },
    },
  ]

  it.each(revocationCases)('$name', async ({ input, expected }) => {
    const { repository, revoke } = createRepository()
    const session = await revokeAuthenticationSession(input.id, input.revokedAt, repository)

    expect(revoke).toHaveBeenCalledWith(expected.id, expected.revokedAt)
    expect(session.revokedAt).toEqual(expected.revokedAt)
  })
})
