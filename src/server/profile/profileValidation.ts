import { AUTH_EMAIL_PATTERN, AUTH_FIELD_LIMITS, PROFILE_REQUEST_FIELDS } from '../auth/constants'
import { hasOnlyAllowedFields } from '../auth/utils'
import { ProfileError } from './profileErrors'
import type { ProfileInput } from './profileTypes'
import { isProfileImage } from '../../shared/profile'

function invalidRequest(): never {
  throw new ProfileError('INVALID_PROFILE', 'Enter a valid name and email address.')
}

export function parseProfileInput(value: unknown): ProfileInput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalidRequest()
  const input = value as Record<string, unknown>
  if (!hasOnlyAllowedFields(input, PROFILE_REQUEST_FIELDS)) invalidRequest()
  if (typeof input.name !== 'string' || typeof input.email !== 'string' || !isProfileImage(input.profileImage)) invalidRequest()
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  if (!name || name.length > AUTH_FIELD_LIMITS.name) invalidRequest()
  if (email.length > AUTH_FIELD_LIMITS.email || !AUTH_EMAIL_PATTERN.test(email)) invalidRequest()
  return { name, email, profileImage: input.profileImage }
}
