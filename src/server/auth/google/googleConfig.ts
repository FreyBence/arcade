import type { ServerEnvironment } from '../accessToken'

export interface GoogleAuthenticationConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  flowCookieName: string
  successRedirectPath: string
  failureRedirectPath: string
}

function requiredValue(environment: ServerEnvironment, name: string): string {
  const value = environment[name]?.trim()
  if (!value) throw new Error(`${name} is required.`)
  return value
}

export function readGoogleAuthenticationConfig(environment: ServerEnvironment): GoogleAuthenticationConfig {
  const redirectUri = requiredValue(environment, 'GOOGLE_REDIRECT_URI')
  const parsedRedirectUri = new URL(redirectUri)
  const isLocal = parsedRedirectUri.hostname === 'localhost' || parsedRedirectUri.hostname === '127.0.0.1'
  if (parsedRedirectUri.protocol !== 'https:' && !(isLocal && parsedRedirectUri.protocol === 'http:')) {
    throw new Error('GOOGLE_REDIRECT_URI must use HTTPS outside local development.')
  }
  const appUrl = new URL(requiredValue(environment, 'GOOGLE_APP_URL'))
  const isLocalApp = appUrl.hostname === 'localhost' || appUrl.hostname === '127.0.0.1'
  if (appUrl.protocol !== 'https:' && !(isLocalApp && appUrl.protocol === 'http:')) {
    throw new Error('GOOGLE_APP_URL must use HTTPS outside local development.')
  }

  return {
    clientId: requiredValue(environment, 'GOOGLE_CLIENT_ID'),
    clientSecret: requiredValue(environment, 'GOOGLE_CLIENT_SECRET'),
    redirectUri,
    flowCookieName: '__Host-arcade_google_oauth',
    successRedirectPath: new URL('/', appUrl).href,
    failureRedirectPath: new URL('/?googleAuthentication=failed', appUrl).href,
  }
}
