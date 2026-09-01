import type { PrismaClient } from '../../generated/prisma/client'
import { createAccessTokenService, type AccessTokenConfig } from './auth/accessToken'
import { createIdentityHandler } from './auth/identityHandler'
import { createLoginHandler } from './auth/loginHandler'
import { hashPassword, verifyPassword } from './auth/passwordService'
import { PrismaUserRepository } from './auth/prismaUserRepository'
import { createRefreshService, createLogoutHandler, createRefreshHandler, type RefreshConfig } from './auth/refresh'
import { createRegistrationHandler } from './auth/registrationHandler'
import { createGoogleAuthorizationHandler, createGoogleCallbackHandler, createGoogleIdentityVerifier, PrismaGoogleUserRepository, type GoogleAuthenticationConfig } from './auth/google'
import { createRequestAuthenticator } from './auth/requestAuthentication'
import { createProfileHandler } from './profile'
import { PrismaSessionRepository } from './auth/session'
import { createPasswordChangeHandler } from './auth/passwordChange'

export interface ApplicationApi {
  register: (request: Request) => Promise<Response>
  login: (request: Request) => Promise<Response>
  refresh: (request: Request) => Promise<Response>
  logout: (request: Request) => Promise<Response>
  identity: (request: Request) => Promise<Response>
  updateProfile: (request: Request) => Promise<Response>
  changePassword: (request: Request) => Promise<Response>
  googleAuthorization: (request: Request) => Promise<Response>
  googleCallback: (request: Request) => Promise<Response>
}

export function createApplicationApi(
  prisma: PrismaClient,
  accessTokenConfig: AccessTokenConfig,
  refreshConfig: RefreshConfig,
  googleConfig: GoogleAuthenticationConfig,
): ApplicationApi {
  const users = new PrismaUserRepository(prisma)
  const accessTokens = createAccessTokenService(accessTokenConfig)
  const refreshService = createRefreshService(
    refreshConfig,
    new PrismaSessionRepository(prisma),
    accessTokens,
  )
  const authenticator = createRequestAuthenticator(accessTokens)

  return {
    register: createRegistrationHandler({ users, hashPassword }),
    login: createLoginHandler({ users, verifyPassword, startSession: (user) => refreshService.start(user) }),
    refresh: createRefreshHandler(refreshConfig, refreshService),
    logout: createLogoutHandler(refreshConfig, refreshService),
    identity: createIdentityHandler(authenticator, users),
    updateProfile: createProfileHandler(authenticator, users),
    changePassword: createPasswordChangeHandler(authenticator, { users, verifyPassword, hashPassword }),
    googleAuthorization: createGoogleAuthorizationHandler(googleConfig),
    googleCallback: createGoogleCallbackHandler(
      googleConfig,
      createGoogleIdentityVerifier(googleConfig),
      new PrismaGoogleUserRepository(prisma),
      (user) => refreshService.start(user),
    ),
  }
}
