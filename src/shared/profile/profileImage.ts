export const PROFILE_IMAGE_MAX_BYTES = 1024 * 1024
export const PROFILE_IMAGE_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/

export function isProfileImage(value: unknown): value is string | null {
  if (value === null) return true
  if (typeof value !== 'string') return false
  const match = DATA_URL_PATTERN.exec(value)
  if (!match) return false
  const base64 = match[2]
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return (base64.length * 3) / 4 - padding <= PROFILE_IMAGE_MAX_BYTES
}
