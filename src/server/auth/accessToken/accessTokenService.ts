import { jwtVerify, SignJWT } from 'jose'
import { isUserRole } from '../../../shared/auth'
import { InvalidAccessTokenError } from './accessTokenErrors'
import type { AccessTokenClock, AccessTokenConfig, AccessTokenIdentity, VerifiedAccessToken } from './accessTokenTypes'

const ACCESS_TOKEN_ALGORITHM = 'HS256'

const systemClock: AccessTokenClock = {
  now: () => new Date(),
}

export function createAccessTokenService(config: AccessTokenConfig, clock: AccessTokenClock = systemClock) {
  const signingKey = new TextEncoder().encode(config.secret)

  return {
    async issue(identity: AccessTokenIdentity): Promise<string> {
      const issuedAt = Math.floor(clock.now().getTime() / 1000)

      return new SignJWT({ role: identity.role })
        .setProtectedHeader({ alg: ACCESS_TOKEN_ALGORITHM, typ: 'JWT' })
        .setSubject(identity.userId)
        .setIssuer(config.issuer)
        .setAudience(config.audience)
        .setIssuedAt(issuedAt)
        .setExpirationTime(issuedAt + config.lifetimeSeconds)
        .sign(signingKey)
    },

    async verify(token: string): Promise<VerifiedAccessToken> {
      try {
        const { payload } = await jwtVerify(token, signingKey, {
          algorithms: [ACCESS_TOKEN_ALGORITHM],
          issuer: config.issuer,
          audience: config.audience,
          currentDate: clock.now(),
        })

        if (!payload.sub || !isUserRole(payload.role) || payload.iat === undefined || payload.exp === undefined) {
          throw new InvalidAccessTokenError()
        }

        return {
          userId: payload.sub,
          role: payload.role,
          issuedAt: new Date(payload.iat * 1000),
          expiresAt: new Date(payload.exp * 1000),
        }
      } catch (error) {
        if (error instanceof InvalidAccessTokenError) throw error
        throw new InvalidAccessTokenError()
      }
    },
  }
}
