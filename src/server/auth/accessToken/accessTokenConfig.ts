import type { AccessTokenConfig } from './accessTokenTypes'

const MINIMUM_SECRET_BYTES = 32
const MAXIMUM_LIFETIME_SECONDS = 60 * 60

export type ServerEnvironment = Record<string, string | undefined>

function requiredValue(environment: ServerEnvironment, name: string): string {
  const value = environment[name]?.trim()
  if (!value) throw new Error(`${name} is required.`)
  return value
}

export function readAccessTokenConfig(environment: ServerEnvironment): AccessTokenConfig {
  const secret = requiredValue(environment, 'ACCESS_TOKEN_SECRET')
  const lifetimeValue = requiredValue(environment, 'ACCESS_TOKEN_TTL_SECONDS')
  const lifetimeSeconds = Number(lifetimeValue)

  if (new TextEncoder().encode(secret).length < MINIMUM_SECRET_BYTES) {
    throw new Error(`ACCESS_TOKEN_SECRET must contain at least ${MINIMUM_SECRET_BYTES} bytes.`)
  }
  if (!Number.isInteger(lifetimeSeconds) || lifetimeSeconds <= 0 || lifetimeSeconds > MAXIMUM_LIFETIME_SECONDS) {
    throw new Error(`ACCESS_TOKEN_TTL_SECONDS must be an integer between 1 and ${MAXIMUM_LIFETIME_SECONDS}.`)
  }

  return {
    secret,
    lifetimeSeconds,
    issuer: requiredValue(environment, 'ACCESS_TOKEN_ISSUER'),
    audience: requiredValue(environment, 'ACCESS_TOKEN_AUDIENCE'),
  }
}
