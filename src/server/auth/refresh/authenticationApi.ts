import { createPrismaClient } from '../../database/prisma'
import { createAccessTokenService, type AccessTokenConfig } from '../accessToken'
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

  return {
    authenticate: createRequestAuthenticator(accessTokens),
    login: createLoginHandler({
      startSession: (user) => refreshService.start(user),
      users: new PrismaUserRepository(prisma),
      verifyPassword,
    }),
    logout: createLogoutHandler(refreshConfig, refreshService),
    refresh: createRefreshHandler(refreshConfig, refreshService),
    close: () => prisma.$disconnect(),
  }
}
