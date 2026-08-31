import type { AuthenticationSession, AuthenticationSessionState } from './sessionTypes'

export function getAuthenticationSessionState(
  session: Pick<AuthenticationSession, 'expiresAt' | 'revokedAt'>,
  now: Date,
): AuthenticationSessionState {
  if (session.revokedAt !== null) return 'revoked'
  if (session.expiresAt.getTime() <= now.getTime()) return 'expired'
  return 'active'
}
