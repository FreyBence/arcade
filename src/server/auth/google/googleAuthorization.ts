import { createHash, randomBytes } from 'node:crypto'
import type { GoogleAuthenticationConfig } from './googleConfig'
import { serializeGoogleFlowCookie } from './googleFlowCookie'
import type { GoogleFlowState } from './googleTypes'

const GOOGLE_AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'

function randomCredential(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

export function createGoogleAuthorizationHandler(
  config: GoogleAuthenticationConfig,
  createFlow: () => GoogleFlowState = () => ({ state: randomCredential(), nonce: randomCredential(), codeVerifier: randomCredential(48) }),
) {
  return function handleGoogleAuthorization(): Promise<Response> {
    const flow = createFlow()
    const codeChallenge = createHash('sha256').update(flow.codeVerifier, 'ascii').digest('base64url')
    const location = new URL(GOOGLE_AUTHORIZATION_ENDPOINT)
    location.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: flow.state,
      nonce: flow.nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    }).toString()
    return Promise.resolve(new Response(null, { status: 302, headers: { location: location.href, 'set-cookie': serializeGoogleFlowCookie(flow, config) } }))
  }
}
