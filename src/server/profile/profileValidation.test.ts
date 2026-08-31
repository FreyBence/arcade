import { describe, expect, it } from 'vitest'
import { ProfileError } from './profileErrors'
import { parseProfileInput } from './profileValidation'

const validationCases = [
  { name: 'normalizes valid profile data', input: { name: '  Dino Player  ', email: ' PLAYER@Example.com ' }, expected: { value: { name: 'Dino Player', email: 'player@example.com' }, code: undefined } },
  { name: 'rejects an empty name', input: { name: ' ', email: 'player@example.com' }, expected: { value: undefined, code: 'INVALID_PROFILE' } },
  { name: 'rejects an invalid email', input: { name: 'Dino', email: 'invalid' }, expected: { value: undefined, code: 'INVALID_PROFILE' } },
  { name: 'rejects role modification', input: { name: 'Dino', email: 'player@example.com', role: 'ADMIN' }, expected: { value: undefined, code: 'INVALID_PROFILE' } },
  { name: 'rejects Dino Coin modification', input: { name: 'Dino', email: 'player@example.com', dinoCoins: 999 }, expected: { value: undefined, code: 'INVALID_PROFILE' } },
]

describe('parseProfileInput', () => {
  it.each(validationCases)('$name', ({ input, expected }) => {
    let value: unknown
    let code: string | undefined
    try { value = parseProfileInput(input) } catch (error) { code = error instanceof ProfileError ? error.code : 'unexpected' }
    expect({ value, code }).toEqual(expected)
  })
})
