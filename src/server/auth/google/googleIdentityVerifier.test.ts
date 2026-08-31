import { describe, expect, it, vi } from 'vitest'
import type { GoogleAuthenticationConfig } from './googleConfig'
import { createGoogleIdentityVerifier } from './googleIdentityVerifier'

const config: GoogleAuthenticationConfig = {
  clientId: 'google-client-id', clientSecret: 'google-client-secret',
  redirectUri: 'https://arcade.example/api/auth/google/callback', flowCookieName: '__Host-arcade_google_oauth',
  successRedirectPath: 'https://arcade.example/', failureRedirectPath: 'https://arcade.example/?googleAuthentication=failed',
}

const verificationCases = [
  { name: 'accepts a verified Google identity with the expected nonce', input: { status: 200, nonce: 'expected-nonce', emailVerified: true }, expected: { error: undefined, subject: 'google-subject' } },
  { name: 'rejects a token with a different nonce', input: { status: 200, nonce: 'different-nonce', emailVerified: true }, expected: { error: 'Google identity validation failed.', subject: undefined } },
  { name: 'rejects an unverified Google email', input: { status: 200, nonce: 'expected-nonce', emailVerified: false }, expected: { error: 'Google identity validation failed.', subject: undefined } },
  { name: 'rejects a failed authorization-code exchange', input: { status: 400, nonce: 'expected-nonce', emailVerified: true }, expected: { error: 'Google token exchange failed.', subject: undefined } },
]

describe('Google identity verification', () => {
  it.each(verificationCases)('$name', async ({ input, expected }) => {
    let exchangedBody = ''
    const fetcher: typeof fetch = vi.fn((_request: RequestInfo | URL, init?: RequestInit) => {
      exchangedBody = init?.body instanceof URLSearchParams ? init.body.toString() : ''
      return Promise.resolve(Response.json(input.status === 200 ? { id_token: 'signed-google-id-token' } : { error: 'invalid_grant' }, { status: input.status }))
    })
    const verifyIdToken = vi.fn(() => Promise.resolve({
      sub: 'google-subject', email: 'Player@Example.com', email_verified: input.emailVerified,
      name: 'Dino Player', nonce: input.nonce,
    }))

    const result = await createGoogleIdentityVerifier(config, fetcher, verifyIdToken)
      .exchangeAndVerify('authorization-code', 'expected-nonce', 'pkce-verifier')
      .then((value) => ({ value, error: undefined as string | undefined }))
      .catch((error: unknown) => ({ value: undefined, error: error instanceof Error ? error.message : String(error) }))

    expect({ error: result.error, subject: result.value?.subject }).toEqual(expected)
    expect(exchangedBody).toContain('code=authorization-code')
    expect(exchangedBody).toContain('code_verifier=pkce-verifier')
    expect(exchangedBody).toContain('client_secret=google-client-secret')
    expect(verifyIdToken).toHaveBeenCalledTimes(input.status === 200 ? 1 : 0)
  })
})
