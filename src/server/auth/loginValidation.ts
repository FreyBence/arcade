import { AUTH_EMAIL_PATTERN, AUTH_FIELD_LIMITS, LOGIN_REQUEST_FIELDS } from './constants'
import { LoginError } from './loginErrors'
import type { LoginInput } from './loginTypes'
import { hasOnlyAllowedFields } from './utils'

function invalidRequest(): never {
  throw new LoginError('INVALID_REQUEST', 'Email and password must be valid.')
}

export function parseLoginInput(value: unknown): LoginInput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalidRequest()

  const input = value as Record<string, unknown>
  if (!hasOnlyAllowedFields(input, LOGIN_REQUEST_FIELDS)) invalidRequest()
  if (typeof input.email !== 'string' || typeof input.password !== 'string') invalidRequest()

  const email = input.email.trim().toLowerCase()
  if (email.length > AUTH_FIELD_LIMITS.email || !AUTH_EMAIL_PATTERN.test(email)) invalidRequest()
  if (input.password.length === 0 || input.password.length > AUTH_FIELD_LIMITS.password) invalidRequest()

  return { email, password: input.password }
}
