import { RegistrationError } from '../registrationErrors'
import type { PasswordHasher, SafeUser } from '../registrationTypes'
import { parseRegistrationInput } from '../registrationValidation'

const REQUIRED_ENVIRONMENT_KEYS = ['ADMIN_NAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'] as const

export interface AdminBootstrapConfig {
  name: string
  email: string
  password: string
}

export interface NewAdminRecord {
  name: string
  email: string
  passwordHash: string
  role: 'ADMIN'
}

export interface AdminBootstrapRepository {
  upsertAdmin(admin: NewAdminRecord): Promise<SafeUser>
}

export class AdminBootstrapError extends Error {
  constructor(public readonly code: 'MISSING_CONFIG' | 'INVALID_CONFIG' | 'EMAIL_OWNED_BY_NON_ADMIN', message: string) {
    super(message)
    this.name = 'AdminBootstrapError'
  }
}

export function readAdminBootstrapConfig(environment: Record<string, string | undefined>): AdminBootstrapConfig {
  const missing = REQUIRED_ENVIRONMENT_KEYS.filter((key) => !environment[key])
  if (missing.length > 0) {
    throw new AdminBootstrapError('MISSING_CONFIG', `Missing required admin bootstrap configuration: ${missing.join(', ')}.`)
  }

  try {
    return parseRegistrationInput({
      name: environment.ADMIN_NAME,
      email: environment.ADMIN_EMAIL,
      password: environment.ADMIN_PASSWORD,
    })
  } catch (error) {
    if (error instanceof RegistrationError) {
      throw new AdminBootstrapError('INVALID_CONFIG', 'Admin bootstrap configuration is invalid.')
    }
    throw error
  }
}

export async function bootstrapAdmin(
  config: AdminBootstrapConfig,
  dependencies: { hashPassword: PasswordHasher; users: AdminBootstrapRepository },
): Promise<SafeUser> {
  const passwordHash = await dependencies.hashPassword(config.password)
  const user = await dependencies.users.upsertAdmin({
    name: config.name,
    email: config.email,
    passwordHash,
    role: 'ADMIN',
  })
  if (user.role !== 'ADMIN') {
    throw new AdminBootstrapError('EMAIL_OWNED_BY_NON_ADMIN', 'The configured admin email is already owned by a non-admin user.')
  }
  return user
}
