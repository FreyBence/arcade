import { randomBytes } from 'node:crypto'
import type { SafeUser } from '../registrationTypes'
import { getAuthenticationSessionState, hashRefreshToken, type AuthenticationSessionRepository } from '../session'
import type { RefreshConfig } from './refreshConfig'
import { serializeRefreshCookie } from './refreshCookie'
import { InvalidRefreshSessionError } from './refreshErrors'
import type { AccessTokenIssuer, RefreshClock, RefreshTokenGenerator, StartedRefreshSession } from './refreshTypes'

const systemClock: RefreshClock = { now: () => new Date() }
const secureRefreshToken: RefreshTokenGenerator = () => randomBytes(32).toString('base64url')

export function createRefreshService(
  config: RefreshConfig,
  sessions: AuthenticationSessionRepository,
  accessTokens: AccessTokenIssuer,
  clock: RefreshClock = systemClock,
  generateRefreshToken: RefreshTokenGenerator = secureRefreshToken,
) {
  return {
    async start(user: SafeUser): Promise<StartedRefreshSession> {
      const refreshToken = generateRefreshToken()
      const now = clock.now()
      const expiresAt = new Date(now.getTime() + config.lifetimeSeconds * 1000)
      await sessions.create({ userId: user.id, refreshTokenHash: hashRefreshToken(refreshToken), expiresAt })
      const accessToken = await accessTokens.issue({ userId: user.id, role: user.role })

      return { accessToken, refreshCookie: serializeRefreshCookie(refreshToken, config) }
    },

    async refresh(refreshToken: string): Promise<string> {
      const session = await sessions.findByRefreshTokenHash(hashRefreshToken(refreshToken))
      if (!session || getAuthenticationSessionState(session, clock.now()) !== 'active') {
        throw new InvalidRefreshSessionError()
      }

      return accessTokens.issue({ userId: session.userId, role: session.userRole })
    },

    async logout(refreshToken: string): Promise<void> {
      const session = await sessions.findByRefreshTokenHash(hashRefreshToken(refreshToken))
      if (!session || session.revokedAt !== null) return
      await sessions.revoke(session.id, clock.now())
    },
  }
}
