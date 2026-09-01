import { describe, expect, it } from 'vitest'
import { AdminDinoCoinsValidationError, parseAdminDinoCoinsInput } from './adminDinoCoinsValidation'

const cases = [
  { name: 'accepts a zero balance', input: { userId: 'user-1', dinoCoins: 0 }, expected: { value: { userId: 'user-1', dinoCoins: 0 }, error: undefined } },
  { name: 'accepts a positive integer balance', input: { userId: ' user-1 ', dinoCoins: 250 }, expected: { value: { userId: 'user-1', dinoCoins: 250 }, error: undefined } },
  { name: 'rejects a negative balance', input: { userId: 'user-1', dinoCoins: -1 }, expected: { value: undefined, error: 'AdminDinoCoinsValidationError' } },
  { name: 'rejects a fractional balance', input: { userId: 'user-1', dinoCoins: 1.5 }, expected: { value: undefined, error: 'AdminDinoCoinsValidationError' } },
  { name: 'rejects a numeric string', input: { userId: 'user-1', dinoCoins: '12' }, expected: { value: undefined, error: 'AdminDinoCoinsValidationError' } },
  { name: 'rejects a balance beyond the database integer range', input: { userId: 'user-1', dinoCoins: 2_147_483_648 }, expected: { value: undefined, error: 'AdminDinoCoinsValidationError' } },
  { name: 'rejects a missing target user', input: { dinoCoins: 12 }, expected: { value: undefined, error: 'AdminDinoCoinsValidationError' } },
  { name: 'rejects unexpected fields', input: { userId: 'user-1', dinoCoins: 12, role: 'ADMIN' }, expected: { value: undefined, error: 'AdminDinoCoinsValidationError' } },
]

describe('admin Dino Coin validation', () => {
  it.each(cases)('$name', ({ input, expected }) => {
    let value: unknown
    let error: string | undefined
    try { value = parseAdminDinoCoinsInput(input) } catch (caught) { error = caught instanceof AdminDinoCoinsValidationError ? caught.name : 'UnexpectedError' }
    expect({ value, error }).toEqual(expected)
  })
})
