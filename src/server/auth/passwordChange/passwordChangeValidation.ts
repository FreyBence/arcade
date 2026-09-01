import { AUTH_FIELD_LIMITS, PASSWORD_CHANGE_REQUEST_FIELDS } from '../constants'
import { hasOnlyAllowedFields } from '../utils'
import { PasswordChangeError } from './passwordChangeErrors'
import type { PasswordChangeInput } from './passwordChangeTypes'

function invalidRequest(): never {
  throw new PasswordChangeError('INVALID_PASSWORD_CHANGE', 'Current and new passwords must be valid.')
}

export function parsePasswordChangeInput(value: unknown): PasswordChangeInput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalidRequest()
  const input = value as Record<string, unknown>
  if (!hasOnlyAllowedFields(input, PASSWORD_CHANGE_REQUEST_FIELDS)) invalidRequest()
  if (typeof input.currentPassword !== 'string' || typeof input.newPassword !== 'string') invalidRequest()
  if (input.currentPassword.length === 0 || input.currentPassword.length > AUTH_FIELD_LIMITS.password) invalidRequest()
  if (input.newPassword.length < AUTH_FIELD_LIMITS.registrationPasswordMinimum || input.newPassword.length > AUTH_FIELD_LIMITS.password) invalidRequest()
  return { currentPassword: input.currentPassword, newPassword: input.newPassword }
}
