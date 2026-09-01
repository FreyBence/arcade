// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import type { NewAdminRecord } from './bootstrap'
import { PrismaUserRepository } from './prismaUserRepository'

const admin: NewAdminRecord = {
  name: 'Arcade Administrator',
  email: 'admin@example.com',
  passwordHash: 'argon2-hash',
  role: 'ADMIN',
}

const upsertCases = [
  {
    name: 'updates any existing account with the configured administrator data',
    input: admin,
    expected: { where: { email: admin.email }, create: admin, update: admin },
  },
]

describe('PrismaUserRepository admin upsert', () => {
  it.each(upsertCases)('$name', async ({ input, expected }) => {
    let operation: unknown
    const upsert = vi.fn((value: unknown) => { operation = value; return Promise.resolve({ ...input, id: 'admin-id' }) })
    const repository = new PrismaUserRepository({ user: { upsert } } as never)

    await repository.upsertAdmin(input)

    expect(operation).toMatchObject(expected)
    expect(upsert).toHaveBeenCalledTimes(1)
  })
})
