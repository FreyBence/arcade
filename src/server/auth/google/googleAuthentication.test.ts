import { describe, expect, it, vi } from 'vitest'
import type { SafeUser } from '../registrationTypes'
import { createGoogleAuthorizationHandler } from './googleAuthorization'
import { createGoogleCallbackHandler } from './googleCallback'
import { readGoogleAuthenticationConfig, type GoogleAuthenticationConfig } from './googleConfig'
import type { GoogleFlowState, VerifiedGoogleIdentity } from './googleTypes'

const config: GoogleAuthenticationConfig = {
  clientId: 'google-client-id',
  clientSecret: 'google-client-secret',
  redirectUri: 'http://localhost:4173/api/auth/google/callback',
  flowCookieName: '__Host-arcade_google_oauth',
  successRedirectPath: '/',
  failureRedirectPath: '/?googleAuthentication=failed',
}
const completeEnvironment = { GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret', GOOGLE_REDIRECT_URI: config.redirectUri, GOOGLE_APP_URL: 'http://localhost:5173' }
const flow: GoogleFlowState = { state: 'state-value', nonce: 'nonce-value', codeVerifier: 'verifier-value' }
const identity: VerifiedGoogleIdentity = { subject: 'google-subject', email: 'player@example.com', name: 'Dino Player' }
const user: SafeUser = {
  id: '0198f8f2-8ad8-7000-8000-000000000001', name: identity.name, email: identity.email,
  role: 'VIEWER', dinoCoins: 0, createdAt: new Date('2026-08-31T00:00:00.000Z'), updatedAt: new Date('2026-08-31T00:00:00.000Z'),
}

const configCases = [
  { name: 'reads server-only Google configuration', input: completeEnvironment, expected: { error: undefined, clientId: 'id' } },
  { name: 'requires the client secret', input: { ...completeEnvironment, GOOGLE_CLIENT_SECRET: undefined }, expected: { error: 'GOOGLE_CLIENT_SECRET is required.', clientId: undefined } },
  { name: 'rejects an insecure production callback', input: { ...completeEnvironment, GOOGLE_REDIRECT_URI: 'http://arcade.example/auth/callback' }, expected: { error: 'GOOGLE_REDIRECT_URI must use HTTPS outside local development.', clientId: undefined } },
]

describe('Google authentication configuration', () => {
  it.each(configCases)('$name', ({ input, expected }) => {
    let result: GoogleAuthenticationConfig | undefined
    let error: string | undefined
    try { result = readGoogleAuthenticationConfig(input) } catch (caught) { error = caught instanceof Error ? caught.message : String(caught) }
    expect({ error, clientId: result?.clientId }).toEqual(expected)
  })
})

const authorizationCases = [{
  name: 'starts the official authorization-code flow with state, nonce, and PKCE',
  input: flow,
  expected: {
    status: 302,
    origin: 'https://accounts.google.com',
    pathname: '/o/oauth2/v2/auth',
    responseType: 'code',
    scope: 'openid email profile',
    state: flow.state,
    nonce: flow.nonce,
    challengeMethod: 'S256',
    challenge: 'GPXfFfmq30W8w5PWMLNtzZR2q9pxnxZ4FkY2A8xIsF4',
  },
}]

describe('Google authorization entry point', () => {
  it.each(authorizationCases)('$name', async ({ input, expected }) => {
    const response = await createGoogleAuthorizationHandler(config, () => input)()
    const location = new URL(response.headers.get('location') ?? '')
    expect({
      status: response.status, origin: location.origin, pathname: location.pathname,
      responseType: location.searchParams.get('response_type'), scope: location.searchParams.get('scope'),
      state: location.searchParams.get('state'), nonce: location.searchParams.get('nonce'),
      challengeMethod: location.searchParams.get('code_challenge_method'), challenge: location.searchParams.get('code_challenge'),
    }).toEqual(expected)
    expect(response.headers.get('set-cookie')).toContain('HttpOnly; Secure; SameSite=Lax')
    expect(response.headers.get('set-cookie')).toContain(flow.codeVerifier)
  })
})

const callbackCases = [
  { name: 'starts the application session after a valid callback', input: { state: flow.state, code: 'authorization-code', error: undefined, verifierFails: false }, expected: { location: '/', verifierCalls: 1, userCalls: 1, sessionCalls: 1, cookieCount: 2 } },
  { name: 'rejects a mismatched state before exchanging the code', input: { state: 'attacker-state', code: 'authorization-code', error: undefined, verifierFails: false }, expected: { location: '/?googleAuthentication=failed', verifierCalls: 0, userCalls: 0, sessionCalls: 0, cookieCount: 1 } },
  { name: 'handles a denied Google request safely', input: { state: flow.state, code: undefined, error: 'access_denied', verifierFails: false }, expected: { location: '/?googleAuthentication=failed', verifierCalls: 0, userCalls: 0, sessionCalls: 0, cookieCount: 1 } },
  { name: 'does not authenticate an invalid Google identity', input: { state: flow.state, code: 'authorization-code', error: undefined, verifierFails: true }, expected: { location: '/?googleAuthentication=failed', verifierCalls: 1, userCalls: 0, sessionCalls: 0, cookieCount: 1 } },
]

describe('Google OAuth callback', () => {
  it.each(callbackCases)('$name', async ({ input, expected }) => {
    const exchangeAndVerify = vi.fn(() => input.verifierFails ? Promise.reject(new Error('invalid token')) : Promise.resolve(identity))
    const resolve = vi.fn(() => Promise.resolve(user))
    const startSession = vi.fn(() => Promise.resolve({ accessToken: 'application-token', refreshCookie: '__Host-arcade_refresh=refresh-secret; HttpOnly; Secure' }))
    const query = new URLSearchParams({ state: input.state, ...(input.code ? { code: input.code } : {}), ...(input.error ? { error: input.error } : {}) })
    const cookie = `${config.flowCookieName}=${encodeURIComponent(JSON.stringify(flow))}`
    const response = await createGoogleCallbackHandler(config, { exchangeAndVerify }, { resolve }, startSession)(
      new Request(`http://localhost/api/auth/google/callback?${query}`, { headers: { cookie } }),
    )

    expect({
      location: response.headers.get('location'), verifierCalls: exchangeAndVerify.mock.calls.length,
      userCalls: resolve.mock.calls.length, sessionCalls: startSession.mock.calls.length,
      cookieCount: response.headers.getSetCookie().length,
    }).toEqual(expected)
    if (expected.sessionCalls) expect(startSession).toHaveBeenCalledWith(user)
  })
})
