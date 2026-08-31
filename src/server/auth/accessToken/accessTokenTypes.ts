import type { UserRole } from '../../../shared/auth'

export interface AccessTokenIdentity {
  userId: string
  role: UserRole
}

export interface VerifiedAccessToken extends AccessTokenIdentity {
  issuedAt: Date
  expiresAt: Date
}

export interface AccessTokenConfig {
  secret: string
  lifetimeSeconds: number
  issuer: string
  audience: string
}

export interface AccessTokenClock {
  now(): Date
}
