import type { GoogleAuthenticationConfig } from './googleConfig'
import type { GoogleFlowState } from './googleTypes'

const FLOW_LIFETIME_SECONDS = 10 * 60

export function serializeGoogleFlowCookie(flow: GoogleFlowState, config: GoogleAuthenticationConfig): string {
  const value = encodeURIComponent(JSON.stringify(flow))
  return `${config.flowCookieName}=${value}; Max-Age=${FLOW_LIFETIME_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`
}

export function serializeClearedGoogleFlowCookie(config: GoogleAuthenticationConfig): string {
  return `${config.flowCookieName}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; Secure; SameSite=Lax`
}

export function readGoogleFlowCookie(cookieHeader: string | null, config: GoogleAuthenticationConfig): GoogleFlowState | null {
  if (!cookieHeader) return null
  const prefix = `${config.flowCookieName}=`
  const encoded = cookieHeader.split(';').map((value) => value.trim()).find((value) => value.startsWith(prefix))?.slice(prefix.length)
  if (!encoded) return null
  try {
    const value = JSON.parse(decodeURIComponent(encoded)) as Partial<GoogleFlowState>
    return typeof value.state === 'string' && typeof value.nonce === 'string' && typeof value.codeVerifier === 'string'
      ? { state: value.state, nonce: value.nonce, codeVerifier: value.codeVerifier }
      : null
  } catch {
    return null
  }
}
