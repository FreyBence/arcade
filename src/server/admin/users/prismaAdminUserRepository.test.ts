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

const roleCases = [
  { name: 'promotes a viewer without counting admins', input: { current: 'VIEWER', role: 'ADMIN', admins: 1 }, expected: { status: 'updated', counts: 0, updates: 1 } },
  { name: 'demotes an admin while another admin remains', input: { current: 'ADMIN', role: 'VIEWER', admins: 2 }, expected: { status: 'updated', counts: 1, updates: 1 } },
  { name: 'prevents demotion of the last admin', input: { current: 'ADMIN', role: 'VIEWER', admins: 1 }, expected: { status: 'last-admin', counts: 1, updates: 0 } },
  { name: 'reports a missing target', input: { current: null, role: 'ADMIN', admins: 1 }, expected: { status: 'not-found', counts: 0, updates: 0 } },
] as const

describe('PrismaAdminUserRepository role update', () => {
  it.each(roleCases)('$name', async ({ input, expected }) => {
    const count = vi.fn().mockResolvedValue(input.admins)
    const update = vi.fn().mockResolvedValue({ id: 'user-1', role: input.role })
    const transaction = { user: { findUnique: vi.fn().mockResolvedValue(input.current ? { role: input.current } : null), count, update } }
    const transactionOptions: unknown[] = []
    const runTransaction = vi.fn((operation: (client: typeof transaction) => unknown, options: unknown) => { transactionOptions.push(options); return operation(transaction) })
    const repository = new PrismaAdminUserRepository({ $transaction: runTransaction } as never)
    const result = await repository.setRole('user-1', input.role)
    expect({ status: result.status, counts: count.mock.calls.length, updates: update.mock.calls.length }).toEqual(expected)
    expect(transactionOptions[0]).toEqual({ isolationLevel: 'Serializable' })
  })
})
