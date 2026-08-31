import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import type { GoogleAuthenticationConfig } from './googleConfig'
import type { GoogleIdentityVerifier, VerifiedGoogleIdentity } from './googleTypes'

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

interface GoogleTokenBody { id_token?: unknown }

export function createGoogleIdentityVerifier(
  config: GoogleAuthenticationConfig,
  fetcher: typeof fetch = fetch,
  verifyIdToken: (token: string) => Promise<JWTPayload> = async (token) => {
    const { payload } = await jwtVerify(token, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: config.clientId,
    })
    return payload
  },
): GoogleIdentityVerifier {
  return {
    async exchangeAndVerify(code, expectedNonce, codeVerifier): Promise<VerifiedGoogleIdentity> {
      const tokenResponse = await fetcher(GOOGLE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.redirectUri,
          grant_type: 'authorization_code',
          code_verifier: codeVerifier,
        }),
      })
      const tokenBody = await tokenResponse.json().catch(() => ({})) as GoogleTokenBody
      if (!tokenResponse.ok || typeof tokenBody.id_token !== 'string') throw new Error('Google token exchange failed.')

      const payload = await verifyIdToken(tokenBody.id_token)
      if (payload.nonce !== expectedNonce
        || typeof payload.sub !== 'string'
        || typeof payload.email !== 'string'
        || payload.email_verified !== true) {
        throw new Error('Google identity validation failed.')
      }
      return {
        subject: payload.sub,
        email: payload.email.trim().toLowerCase(),
        name: typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : payload.email.split('@')[0],
      }
    },
  }
}
