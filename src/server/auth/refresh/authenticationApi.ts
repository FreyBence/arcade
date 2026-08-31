import { createPrismaClient } from '../../database/prisma'
import { createAccessTokenService, type AccessTokenConfig } from '../accessToken'
import { createLoginHandler } from '../loginHandler'
import { verifyPassword } from '../passwordService'
import { PrismaUserRepository } from '../prismaUserRepository'
import { PrismaSessionRepository } from '../session'
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
    login: createLoginHandler({
      startSession: (user) => refreshService.start(user),
      users: new PrismaUserRepository(prisma),
      verifyPassword,
    }),
    refresh: createRefreshHandler(refreshConfig, refreshService),
    close: () => prisma.$disconnect(),
  }
}
