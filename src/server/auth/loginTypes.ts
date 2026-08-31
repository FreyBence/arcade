import type { SafeUser } from './registrationTypes'
import type { StartedRefreshSession } from './refresh'

export interface LoginInput {
  email: string
  password: string
}

export interface CredentialUser extends SafeUser {
  passwordHash: string
}

export interface AuthenticationUserRepository {
  findForAuthentication(email: string): Promise<CredentialUser | null>
}

export interface PasswordVerifier {
  (plaintextPassword: string, passwordHash: string): Promise<boolean>
}

export interface SessionStarter {
  (user: SafeUser): Promise<StartedRefreshSession>
}

export interface LoginResult extends StartedRefreshSession {
  user: SafeUser
}
