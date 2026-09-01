import { describe, expect, it, vi } from 'vitest'
import { PasswordChangeError } from './passwordChangeErrors'
import { changePassword } from './passwordChangeService'

const cases = [
  { name: 'verifies the current password and persists only the new hash', input: { storedHash: 'stored-hash', matches: true }, expected: { result: true, code: undefined, hashCalls: 1, update: ['user-id', 'new-secure-hash'] } },
  { name: 'rejects an incorrect current password before hashing', input: { storedHash: 'stored-hash', matches: false }, expected: { result: undefined, code: 'INCORRECT_CURRENT_PASSWORD', hashCalls: 0, update: undefined } },
  { name: 'rejects an account without a local password before hashing', input: { storedHash: null, matches: false }, expected: { result: undefined, code: 'INCORRECT_CURRENT_PASSWORD', hashCalls: 0, update: undefined } },
]

describe('changePassword', () => it.each(cases)('$name', async ({ input, expected }) => {
  const updatePasswordHash = vi.fn(() => Promise.resolve(true)); const hashPassword = vi.fn(() => Promise.resolve('new-secure-hash'))
  let result: boolean | undefined; let code: string | undefined
  try {
    result = await changePassword('user-id', { currentPassword: 'current-secret', newPassword: 'new-secret' }, {
      users: { findPasswordHashById: vi.fn(() => Promise.resolve(input.storedHash)), updatePasswordHash },
      verifyPassword: vi.fn(() => Promise.resolve(input.matches)), hashPassword,
    })
  } catch (error) { code = error instanceof PasswordChangeError ? error.code : 'unexpected' }
  expect({ result, code, hashCalls: hashPassword.mock.calls.length, update: updatePasswordHash.mock.calls[0] }).toEqual(expected)
  expect(updatePasswordHash).not.toHaveBeenCalledWith('user-id', 'new-secret')
}))
