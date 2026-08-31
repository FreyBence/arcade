import { createPrismaClient } from '../../database/prisma'
import { createAccessTokenService, type AccessTokenConfig } from '../accessToken'
import { protectAdminEndpoint } from '../authorization'
import { createLoginHandler } from '../loginHandler'
import { verifyPassword } from '../passwordService'
import { PrismaUserRepository } from '../prismaUserRepository'
import { createRequestAuthenticator } from '../requestAuthentication'
import { PrismaSessionRepository } from '../session'
import { createLogoutHandler } from './logoutHandler'
import type { RefreshConfig } from './refreshConfig'
import { createRefreshHandler } from './refreshHandler'
import { createRefreshService } from './refreshService'

export function createAuthenticationApi(
  databaseUrl: string,
  accessTokenConfig: AccessTokenConfig,
  refreshConfig: RefreshConfig,
) {
  const prisma = createPrismaClient(databaseUrl)
  const accessTokens = createAccessTokenService(accessTokenConfig)
  const refreshService = createRefreshService(
    refreshConfig,
    new PrismaSessionRepository(prisma),
    accessTokens,
  )

  const authenticator = createRequestAuthenticator(accessTokens)

  return {
    authenticate: authenticator,
    login: createLoginHandler({
      startSession: (user) => refreshService.start(user),
      users: new PrismaUserRepository(prisma),
      verifyPassword,
    }),
    logout: createLogoutHandler(refreshConfig, refreshService),
    refresh: createRefreshHandler(refreshConfig, refreshService),
    protectAdmin: (handler: Parameters<typeof protectAdminEndpoint>[1]) => protectAdminEndpoint(authenticator, handler),
    close: () => prisma.$disconnect(),
  }
}
