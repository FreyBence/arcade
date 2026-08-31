import { AUTH_EMAIL_PATTERN, AUTH_FIELD_LIMITS, REGISTRATION_REQUEST_FIELDS } from './constants'
import { RegistrationError } from './registrationErrors'
import type { RegistrationInput } from './registrationTypes'
import { hasOnlyAllowedFields } from './utils'

function invalidRequest(): never {
  throw new RegistrationError('INVALID_REQUEST', 'Name, email, and password must be valid.')
}

export function parseRegistrationInput(value: unknown): RegistrationInput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalidRequest()

  const input = value as Record<string, unknown>
  if (!hasOnlyAllowedFields(input, REGISTRATION_REQUEST_FIELDS)) invalidRequest()

  if (typeof input.name !== 'string' || typeof input.email !== 'string' || typeof input.password !== 'string') {
    invalidRequest()
  }

  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()

  if (name.length === 0 || name.length > AUTH_FIELD_LIMITS.name) invalidRequest()
  if (email.length > AUTH_FIELD_LIMITS.email || !AUTH_EMAIL_PATTERN.test(email)) invalidRequest()
  if (input.password.length < AUTH_FIELD_LIMITS.registrationPasswordMinimum || input.password.length > AUTH_FIELD_LIMITS.password) invalidRequest()

  return { name, email, password: input.password }
}
