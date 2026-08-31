import { createApplicationApi } from './applicationApi'
import { createApiRouter } from './apiRouter'
import { readAccessTokenConfig } from './auth/accessToken'
import { readRefreshConfig } from './auth/refresh'
import { readGoogleAuthenticationConfig } from './auth/google'
import { createPrismaClient } from './database/prisma'

export function createConfiguredApplication(environment: Record<string, string | undefined>) {
  const databaseUrl = environment.DATABASE_URL?.trim()
  if (!databaseUrl) throw new Error('DATABASE_URL is required.')

  const prisma = createPrismaClient(databaseUrl)
  const api = createApplicationApi(
    prisma,
    readAccessTokenConfig(environment),
    readRefreshConfig(environment),
    readGoogleAuthenticationConfig(environment),
  )

  return {
    routeApiRequest: createApiRouter(api),
    close: () => prisma.$disconnect(),
  }
}
