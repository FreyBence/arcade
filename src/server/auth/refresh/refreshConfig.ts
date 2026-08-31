import type { ServerEnvironment } from '../accessToken'

const MAXIMUM_REFRESH_LIFETIME_SECONDS = 366 * 24 * 60 * 60
const COOKIE_NAME_PATTERN = /^__Host-[A-Za-z0-9_-]+$/

export interface RefreshConfig {
  lifetimeSeconds: number
  cookieName: string
}

export function readRefreshConfig(environment: ServerEnvironment): RefreshConfig {
  const lifetimeValue = environment.REFRESH_TOKEN_TTL_SECONDS?.trim()
  const cookieName = environment.REFRESH_TOKEN_COOKIE_NAME?.trim()
  const lifetimeSeconds = Number(lifetimeValue)

  if (!Number.isInteger(lifetimeSeconds) || lifetimeSeconds <= 0 || lifetimeSeconds > MAXIMUM_REFRESH_LIFETIME_SECONDS) {
    throw new Error(`REFRESH_TOKEN_TTL_SECONDS must be an integer between 1 and ${MAXIMUM_REFRESH_LIFETIME_SECONDS}.`)
  }
  if (!cookieName || !COOKIE_NAME_PATTERN.test(cookieName)) {
    throw new Error('REFRESH_TOKEN_COOKIE_NAME must use a valid __Host- cookie name.')
  }

  return { lifetimeSeconds, cookieName }
}
