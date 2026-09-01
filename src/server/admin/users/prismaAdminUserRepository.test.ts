import { describe, expect, it, vi } from 'vitest'
import { PrismaAdminUserRepository } from './prismaAdminUserRepository'

const cases = [
  { name: 'lists all users for an empty search', input: { query: '  ' }, expected: { where: undefined } },
  { name: 'searches name and email with partial case-insensitive matching', input: { query: '  DiNo  ' }, expected: { where: { OR: [{ name: { contains: 'DiNo', mode: 'insensitive' } }, { email: { contains: 'DiNo', mode: 'insensitive' } }] } } },
]

describe('PrismaAdminUserRepository search', () => {
  it.each(cases)('$name', async ({ input, expected }) => {
    const findMany = vi.fn().mockResolvedValue([])
    const repository = new PrismaAdminUserRepository({ user: { findMany } } as never)
    await repository.search(input.query)
    expect(findMany.mock.calls[0][0]).toMatchObject(expected)
  })
})
