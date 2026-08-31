import { hashRefreshToken } from './refreshTokenHash'
import type { AuthenticationSession, AuthenticationSessionRepository } from './sessionTypes'

export interface StartAuthenticationSessionInput {
  userId: string
  refreshToken: string
  expiresAt: Date
}

export async function startAuthenticationSession(
  input: StartAuthenticationSessionInput,
  sessions: AuthenticationSessionRepository,
): Promise<AuthenticationSession> {
  return sessions.create({
    userId: input.userId,
    refreshTokenHash: hashRefreshToken(input.refreshToken),
    expiresAt: input.expiresAt,
  })
}

export async function revokeAuthenticationSession(
  id: string,
  revokedAt: Date,
  sessions: AuthenticationSessionRepository,
): Promise<AuthenticationSession> {
  return sessions.revoke(id, revokedAt)
}
