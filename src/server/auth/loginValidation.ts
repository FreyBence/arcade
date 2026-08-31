import { LoginError } from './loginErrors'
import type { LoginInput } from './loginTypes'

const ALLOWED_FIELDS = new Set(['email', 'password'])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function invalidRequest(): never {
  throw new LoginError('INVALID_REQUEST', 'Email and password must be valid.')
}

export function parseLoginInput(value: unknown): LoginInput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalidRequest()

  const input = value as Record<string, unknown>
  if (Object.keys(input).some((field) => !ALLOWED_FIELDS.has(field))) invalidRequest()
  if (typeof input.email !== 'string' || typeof input.password !== 'string') invalidRequest()

  const email = input.email.trim().toLowerCase()
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) invalidRequest()
  if (input.password.length === 0 || input.password.length > 128) invalidRequest()

  return { email, password: input.password }
}
