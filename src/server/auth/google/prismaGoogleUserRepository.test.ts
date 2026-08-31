import { describe, expect, it, vi } from 'vitest'
import type { PrismaClient } from '../../../../generated/prisma/client'
import type { SafeUser } from '../registrationTypes'
import { PrismaGoogleUserRepository } from './prismaGoogleUserRepository'

const identity = { subject: 'google-subject', email: 'player@example.com', name: 'Dino Player' }
const user: SafeUser = {
  id: '0198f8f2-8ad8-7000-8000-000000000001', name: identity.name, email: identity.email,
  role: 'VIEWER', dinoCoins: 0, profileImage: null, createdAt: new Date('2026-08-31T00:00:00.000Z'), updatedAt: new Date('2026-08-31T00:00:00.000Z'),
}

const resolutionCases = [
  { name: 'resolves by the stable Google subject before email', input: { linked: true, existingEmail: false }, expected: { emailLookups: 0, links: 0, creates: 0, role: 'VIEWER', dinoCoins: 0 } },
  { name: 'links a verified Google identity to the same existing email', input: { linked: false, existingEmail: true }, expected: { emailLookups: 1, links: 1, creates: 0, role: 'VIEWER', dinoCoins: 0 } },
  { name: 'creates a non-privileged user for a first Google login', input: { linked: false, existingEmail: false }, expected: { emailLookups: 1, links: 0, creates: 1, role: 'VIEWER', dinoCoins: 0 } },
]

describe('Google user resolution', () => {
  it.each(resolutionCases)('$name', async ({ input, expected }) => {
    const externalCreate = vi.fn(() => Promise.resolve({}))
    const userCreate = vi.fn((query: { data: { role: string; dinoCoins: number } }) => {
      expect(query.data).toMatchObject({ role: 'VIEWER', dinoCoins: 0 })
      return Promise.resolve(user)
    })
    const findUserByEmail = vi.fn(() => Promise.resolve(input.existingEmail ? { ...user, emailVerifiedAt: new Date() } : null))
    const transaction = {
      externalIdentity: {
        findUnique: vi.fn(() => Promise.resolve(input.linked ? { user } : null)),
        create: externalCreate,
      },
      user: {
        findUnique: findUserByEmail,
        update: vi.fn(() => Promise.resolve(user)),
        create: userCreate,
      },
    }
    const prisma = {
      $transaction: (operation: (client: typeof transaction) => Promise<SafeUser>) => operation(transaction),
    } as unknown as PrismaClient

    const result = await new PrismaGoogleUserRepository(prisma).resolve(identity)

    expect({
      emailLookups: findUserByEmail.mock.calls.length, links: externalCreate.mock.calls.length, creates: userCreate.mock.calls.length,
      role: result.role, dinoCoins: result.dinoCoins,
    }).toEqual(expected)
  })
})
