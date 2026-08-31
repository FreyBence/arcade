import type { AccessTokenIdentity } from '../accessToken'

export interface AccessTokenIssuer {
  issue(identity: AccessTokenIdentity): Promise<string>
}

export interface StartedRefreshSession {
  accessToken: string
  refreshCookie: string
}

export interface RefreshClock {
  now(): Date
}

export interface RefreshTokenGenerator {
  (): string
}
