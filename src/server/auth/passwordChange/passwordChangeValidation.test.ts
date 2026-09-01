import { describe, expect, it } from 'vitest'
import { PasswordChangeError } from './passwordChangeErrors'
import { parsePasswordChangeInput } from './passwordChangeValidation'

const cases = [
  { name: 'accepts valid current and new passwords', input: { currentPassword: 'old-password', newPassword: 'new-password' }, expected: { value: { currentPassword: 'old-password', newPassword: 'new-password' }, code: undefined } },
  { name: 'requires the current password', input: { currentPassword: '', newPassword: 'new-password' }, expected: { value: undefined, code: 'INVALID_PASSWORD_CHANGE' } },
  { name: 'applies the minimum password length', input: { currentPassword: 'old-password', newPassword: 'short' }, expected: { value: undefined, code: 'INVALID_PASSWORD_CHANGE' } },
  { name: 'applies the maximum password length', input: { currentPassword: 'old-password', newPassword: 'x'.repeat(129) }, expected: { value: undefined, code: 'INVALID_PASSWORD_CHANGE' } },
  { name: 'rejects unexpected fields', input: { currentPassword: 'old-password', newPassword: 'new-password', confirmation: 'new-password' }, expected: { value: undefined, code: 'INVALID_PASSWORD_CHANGE' } },
]

describe('parsePasswordChangeInput', () => it.each(cases)('$name', ({ input, expected }) => {
  let value: unknown; let code: string | undefined
  try { value = parsePasswordChangeInput(input) } catch (error) { code = error instanceof PasswordChangeError ? error.code : 'unexpected' }
  expect({ value, code }).toEqual(expected)
}))
