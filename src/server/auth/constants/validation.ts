export const AUTH_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const AUTH_FIELD_LIMITS = {
  email: 254,
  name: 100,
  password: 128,
  registrationPasswordMinimum: 8,
} as const

export const LOGIN_REQUEST_FIELDS: readonly string[] = ['email', 'password']
export const REGISTRATION_REQUEST_FIELDS: readonly string[] = ['name', 'email', 'password']
export const PROFILE_REQUEST_FIELDS: readonly string[] = ['name', 'email', 'profileImage']
export const PASSWORD_CHANGE_REQUEST_FIELDS: readonly string[] = ['currentPassword', 'newPassword']
