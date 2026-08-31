import type { GoogleAuthenticationConfig } from './googleConfig'
import { readGoogleFlowCookie, serializeClearedGoogleFlowCookie } from './googleFlowCookie'
import type { GoogleIdentityVerifier, GoogleSessionStarter, GoogleUserRepository } from './googleTypes'

export function createGoogleCallbackHandler(
  config: GoogleAuthenticationConfig,
  verifier: GoogleIdentityVerifier,
  users: GoogleUserRepository,
  startSession: GoogleSessionStarter,
) {
  return async function handleGoogleCallback(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const flow = readGoogleFlowCookie(request.headers.get('cookie'), config)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const clearedFlowCookie = serializeClearedGoogleFlowCookie(config)
    if (!flow || !code || state !== flow.state || url.searchParams.has('error')) {
      return redirect(config.failureRedirectPath, clearedFlowCookie)
    }

    try {
      const identity = await verifier.exchangeAndVerify(code, flow.nonce, flow.codeVerifier)
      const user = await users.resolve(identity)
      const session = await startSession(user)
      return redirect(config.successRedirectPath, clearedFlowCookie, session.refreshCookie)
    } catch {
      return redirect(config.failureRedirectPath, clearedFlowCookie)
    }
  }
}

function redirect(location: string, ...cookies: string[]): Response {
  const headers = new Headers({ location })
  cookies.forEach((cookie) => headers.append('set-cookie', cookie))
  return new Response(null, { status: 303, headers })
}
