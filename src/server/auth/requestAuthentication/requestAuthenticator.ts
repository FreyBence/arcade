import { readBearerToken } from './bearerToken'
import { RequestAuthenticationError } from './requestAuthenticationErrors'
import type { AccessTokenVerifier, RequestAuthenticator } from './requestAuthenticationTypes'

export function createRequestAuthenticator(accessTokens: AccessTokenVerifier): RequestAuthenticator {
  return {
    async authenticate(request) {
      const token = readBearerToken(request)
      try {
        const identity = await accessTokens.verify(token)
        return { userId: identity.userId, role: identity.role }
      } catch {
        throw new RequestAuthenticationError('INVALID_ACCESS_TOKEN')
      }
    },
  }
}
