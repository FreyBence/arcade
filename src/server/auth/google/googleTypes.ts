import type { SafeUser } from '../registrationTypes'
import type { StartedRefreshSession } from '../refresh'

export interface GoogleFlowState {
  state: string
  nonce: string
  codeVerifier: string
}

export interface VerifiedGoogleIdentity {
  subject: string
  email: string
  name: string
}

export interface GoogleIdentityVerifier {
  exchangeAndVerify(code: string, expectedNonce: string, codeVerifier: string): Promise<VerifiedGoogleIdentity>
}

export interface GoogleUserRepository {
  resolve(identity: VerifiedGoogleIdentity): Promise<SafeUser>
}

export interface GoogleSessionStarter {
  (user: SafeUser): Promise<StartedRefreshSession>
}
