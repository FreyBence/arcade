import { describe, expect, it, vi } from 'vitest'
import { PASSWORD_HASH_OPTIONS } from './passwordConfig'
import { hashPassword, verifyPassword } from './passwordService'

const verificationCases = [
  {
    name: 'verifies the password used to create the hash',
    input: { password: 'Correct horse battery staple!', candidate: 'Correct horse battery staple!' },
    expected: true,
  },
  {
    name: 'verifies a password containing Unicode characters',
    input: { password: 'Dínó-arcade-🦕', candidate: 'Dínó-arcade-🦕' },
    expected: true,
  },
  {
    name: 'rejects an incorrect password',
    input: { password: 'Correct horse battery staple!', candidate: 'incorrect password' },
    expected: false,
  },
]

describe('passwordService', () => {
  it.each(verificationCases)('$name', async ({ input, expected }) => {
    const passwordHash = await hashPassword(input.password)
    const actual = await verifyPassword(input.candidate, passwordHash)

    expect(actual).toBe(expected)
  })

  const hashContractCases = [
    {
      name: 'creates an Argon2id hash without embedding the plaintext password',
      input: { password: 'Never persist this plaintext value' },
      expected: { prefix: '$argon2id$', containsPlaintext: false },
    },
  ]

  it.each(hashContractCases)('$name', async ({ input, expected }) => {
    const passwordHash = await hashPassword(input.password)

    expect({
      prefix: passwordHash.slice(0, expected.prefix.length),
      containsPlaintext: passwordHash.includes(input.password),
    }).toEqual(expected)
  })

  const invalidHashCases = [
    { name: 'rejects an empty stored hash', input: { password: 'password', hash: '' }, expected: false },
    { name: 'rejects a malformed stored hash', input: { password: 'password', hash: 'not-an-argon2-hash' }, expected: false },
  ]

  it.each(invalidHashCases)('$name', async ({ input, expected }) => {
    await expect(verifyPassword(input.password, input.hash)).resolves.toBe(expected)
  })

  const loggingCases = [
    { name: 'does not log sensitive values while hashing', input: { operation: 'hash' as const, password: 'hash-secret' }, expected: 0 },
    { name: 'does not log sensitive values while verifying', input: { operation: 'verify' as const, password: 'verify-secret' }, expected: 0 },
  ]

  it.each(loggingCases)('$name', async ({ input, expected }) => {
    const logSpies = [
      vi.spyOn(console, 'debug').mockImplementation(() => undefined),
      vi.spyOn(console, 'error').mockImplementation(() => undefined),
      vi.spyOn(console, 'info').mockImplementation(() => undefined),
      vi.spyOn(console, 'log').mockImplementation(() => undefined),
      vi.spyOn(console, 'warn').mockImplementation(() => undefined),
    ]

    if (input.operation === 'hash') {
      await hashPassword(input.password)
    } else {
      const passwordHash = await hashPassword(input.password)
      await verifyPassword(input.password, passwordHash)
    }

    expect(logSpies.reduce((callCount, spy) => callCount + spy.mock.calls.length, 0)).toBe(expected)
  })

  const configurationCases = [
    {
      name: 'keeps the approved hashing configuration immutable',
      input: PASSWORD_HASH_OPTIONS,
      expected: { frozen: true, memoryCost: 19_456, timeCost: 2, parallelism: 1, hashLength: 32 },
    },
  ]

  it.each(configurationCases)('$name', ({ input, expected }) => {
    expect({
      frozen: Object.isFrozen(input),
      memoryCost: input.memoryCost,
      timeCost: input.timeCost,
      parallelism: input.parallelism,
      hashLength: input.hashLength,
    }).toEqual(expected)
  })
})
