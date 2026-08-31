export type AuthenticationSessionState = 'active' | 'expired' | 'revoked'

export interface AuthenticationSession {
  id: string
  userId: string
  expiresAt: Date
  revokedAt: Date | null
  createdAt: Date
}

export interface StoredAuthenticationSession extends AuthenticationSession {
  refreshTokenHash: string
}

export interface NewAuthenticationSession {
  userId: string
  refreshTokenHash: string
  expiresAt: Date
}

export interface AuthenticationSessionRepository {
  create(session: NewAuthenticationSession): Promise<AuthenticationSession>
  findByRefreshTokenHash(refreshTokenHash: string): Promise<RefreshableAuthenticationSession | null>
  revoke(id: string, revokedAt: Date): Promise<AuthenticationSession>
}

export interface RefreshableAuthenticationSession extends AuthenticationSession {
  userRole: UserRole
}
import type { UserRole } from '../../../shared/auth'
