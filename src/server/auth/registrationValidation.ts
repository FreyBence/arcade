import { RegistrationError } from './registrationErrors'
import type { RegistrationInput } from './registrationTypes'

const ALLOWED_FIELDS = new Set(['name', 'email', 'password'])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function invalidRequest(): never {
  throw new RegistrationError('INVALID_REQUEST', 'Name, email, and password must be valid.')
}

export function parseRegistrationInput(value: unknown): RegistrationInput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalidRequest()

  const input = value as Record<string, unknown>
  if (Object.keys(input).some((field) => !ALLOWED_FIELDS.has(field))) invalidRequest()

  if (typeof input.name !== 'string' || typeof input.email !== 'string' || typeof input.password !== 'string') {
    invalidRequest()
  }

  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()

  if (name.length === 0 || name.length > 100) invalidRequest()
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) invalidRequest()
  if (input.password.length < 8 || input.password.length > 128) invalidRequest()

  return { name, email, password: input.password }
}
