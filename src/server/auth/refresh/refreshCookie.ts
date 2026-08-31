import type { RefreshConfig } from './refreshConfig'

export function serializeRefreshCookie(refreshToken: string, config: RefreshConfig): string {
  return `${config.cookieName}=${encodeURIComponent(refreshToken)}; Max-Age=${config.lifetimeSeconds}; Path=/; HttpOnly; Secure; SameSite=Strict`
}

export function serializeClearedRefreshCookie(config: RefreshConfig): string {
  return `${config.cookieName}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; Secure; SameSite=Strict`
}

export function readRefreshCookie(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) return null

  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=')
    if (separator < 0 || cookie.slice(0, separator).trim() !== cookieName) continue
    try {
      return decodeURIComponent(cookie.slice(separator + 1).trim()) || null
    } catch {
      return null
    }
  }
  return null
}
