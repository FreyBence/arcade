// @vitest-environment node

import { decodeJwt } from 'jose'
import { describe, expect, it } from 'vitest'
import { readAccessTokenConfig, type ServerEnvironment } from './accessTokenConfig'
import { InvalidAccessTokenError } from './accessTokenErrors'
import { createAccessTokenService } from './accessTokenService'
import type { AccessTokenClock, AccessTokenConfig } from './accessTokenTypes'

const PRIMARY_SECRET = 'primary-test-secret-with-at-least-32-bytes'
const SECONDARY_SECRET = 'secondary-test-secret-with-32-bytes!!'

const baseEnvironment: ServerEnvironment = {
  ACCESS_TOKEN_SECRET: PRIMARY_SECRET,
  ACCESS_TOKEN_TTL_SECONDS: '900',
  ACCESS_TOKEN_ISSUER: 'mobile-arcade',
  ACCESS_TOKEN_AUDIENCE: 'mobile-arcade-api',
}

const baseConfig: AccessTokenConfig = {
  secret: PRIMARY_SECRET,
  lifetimeSeconds: 60,
  issuer: 'mobile-arcade',
  audience: 'mobile-arcade-api',
}

function createMutableClock(initial: string) {
  let current = new Date(initial)
  const clock: AccessTokenClock = { now: () => current }
  return {
    clock,
    set: (value: string) => {
      current = new Date(value)
    },
  }
}

const configurationCases = [
  {
    name: 'reads complete server-side access-token configuration',
    input: baseEnvironment,
    expected: {
      secret: PRIMARY_SECRET,
      lifetimeSeconds: 900,
      issuer: 'mobile-arcade',
      audience: 'mobile-arcade-api',
    },
  },
]

const rejectedConfigurationCases = [
  {
    name: 'rejects a missing signing secret',
    input: { ...baseEnvironment, ACCESS_TOKEN_SECRET: '' },
    expected: 'ACCESS_TOKEN_SECRET is required.',
  },
  {
    name: 'rejects a short signing secret',
    input: { ...baseEnvironment, ACCESS_TOKEN_SECRET: 'too-short' },
    expected: 'ACCESS_TOKEN_SECRET must contain at least 32 bytes.',
  },
  {
    name: 'rejects a non-numeric lifetime',
    input: { ...baseEnvironment, ACCESS_TOKEN_TTL_SECONDS: 'later' },
    expected: 'ACCESS_TOKEN_TTL_SECONDS must be an integer between 1 and 3600.',
  },
  {
    name: 'rejects a lifetime longer than one hour',
    input: { ...baseEnvironment, ACCESS_TOKEN_TTL_SECONDS: '3601' },
    expected: 'ACCESS_TOKEN_TTL_SECONDS must be an integer between 1 and 3600.',
  },
  {
    name: 'rejects a missing issuer',
    input: { ...baseEnvironment, ACCESS_TOKEN_ISSUER: '' },
    expected: 'ACCESS_TOKEN_ISSUER is required.',
  },
  {
    name: 'rejects a missing audience',
    input: { ...baseEnvironment, ACCESS_TOKEN_AUDIENCE: '' },
    expected: 'ACCESS_TOKEN_AUDIENCE is required.',
  },
]

describe('access-token configuration', () => {
  it.each(configurationCases)('$name', ({ input, expected }) => {
    expect(readAccessTokenConfig(input)).toEqual(expected)
  })

  it.each(rejectedConfigurationCases)('$name', ({ input, expected }) => {
    expect(() => readAccessTokenConfig(input)).toThrow(expected)
  })
})

describe('access-token service', () => {
  const validTokenCases = [
    {
      name: 'issues and verifies a short-lived token with minimal identity claims',
      input: { userId: '0198f8f2-8ad8-7000-8000-000000000001', role: 'VIEWER' as const },
      expected: {
        identity: {
          userId: '0198f8f2-8ad8-7000-8000-000000000001',
          role: 'VIEWER',
          issuedAt: new Date('2026-08-31T00:00:00.000Z'),
          expiresAt: new Date('2026-08-31T00:01:00.000Z'),
        },
        claimNames: ['aud', 'exp', 'iat', 'iss', 'role', 'sub'],
      },
    },
  ]

  it.each(validTokenCases)('$name', async ({ input, expected }) => {
    const { clock } = createMutableClock('2026-08-31T00:00:00.000Z')
    const service = createAccessTokenService(baseConfig, clock)
    const token = await service.issue(input)

    await expect(service.verify(token)).resolves.toEqual(expected.identity)
    expect(Object.keys(decodeJwt(token)).sort()).toEqual(expected.claimNames)
  })

  const rejectedTokenCases = [
    {
      name: 'rejects an expired token',
      input: { kind: 'expired' as const },
      expected: { name: 'InvalidAccessTokenError', message: 'Access token is invalid or expired.' },
    },
    {
      name: 'rejects a malformed token',
      input: { kind: 'malformed' as const },
      expected: { name: 'InvalidAccessTokenError', message: 'Access token is invalid or expired.' },
    },
    {
      name: 'rejects a modified token',
      input: { kind: 'modified' as const },
      expected: { name: 'InvalidAccessTokenError', message: 'Access token is invalid or expired.' },
    },
    {
      name: 'rejects a token signed with another secret',
      input: { kind: 'wrong-signature' as const },
      expected: { name: 'InvalidAccessTokenError', message: 'Access token is invalid or expired.' },
    },
  ]

  it.each(rejectedTokenCases)('$name', async ({ input, expected }) => {
    const mutableClock = createMutableClock('2026-08-31T00:00:00.000Z')
    const service = createAccessTokenService(baseConfig, mutableClock.clock)
    const validToken = await service.issue({ userId: '0198f8f2-8ad8-7000-8000-000000000001', role: 'VIEWER' })
    let token = validToken

    if (input.kind === 'expired') mutableClock.set('2026-08-31T00:01:01.000Z')
    if (input.kind === 'malformed') token = 'not-a-jwt'
    if (input.kind === 'modified') {
      const segments = token.split('.')
      const signature = segments[2] ?? ''
      segments[2] = `${signature.startsWith('a') ? 'b' : 'a'}${signature.slice(1)}`
      token = segments.join('.')
    }
    if (input.kind === 'wrong-signature') {
      const otherService = createAccessTokenService({ ...baseConfig, secret: SECONDARY_SECRET }, mutableClock.clock)
      token = await otherService.issue({ userId: '0198f8f2-8ad8-7000-8000-000000000001', role: 'VIEWER' })
    }

    const error = await service.verify(token).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(InvalidAccessTokenError)
    expect({ name: (error as Error).name, message: (error as Error).message }).toEqual(expected)
  })
})
