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

const balanceCases = [
  { name: 'persists and returns an updated balance', input: { count: 1 }, expected: { user: { id: 'user-1', dinoCoins: 25 }, update: { where: { id: 'user-1' }, data: { dinoCoins: 25 } }, finds: 1 } },
  { name: 'returns null when the target user does not exist', input: { count: 0 }, expected: { user: null, update: { where: { id: 'user-1' }, data: { dinoCoins: 25 } }, finds: 0 } },
]

describe('PrismaAdminUserRepository Dino Coin update', () => {
  it.each(balanceCases)('$name', async ({ input, expected }) => {
    let updateOperation: unknown
    let finds = 0
    const updateMany = vi.fn((operation: unknown) => { updateOperation = operation; return Promise.resolve({ count: input.count }) })
    const findUnique = vi.fn(() => { finds += 1; return Promise.resolve({ id: 'user-1', dinoCoins: 25 }) })
    const repository = new PrismaAdminUserRepository({ user: { updateMany, findUnique } } as never)
    const user = await repository.setDinoCoins('user-1', 25)
    expect({ user, update: updateOperation, finds }).toEqual(expected)
  })
})
