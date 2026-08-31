import { createPrismaClient } from '../database/prisma'
import { createLoginHandler } from './loginHandler'
import type { SessionStarter } from './loginTypes'
import { verifyPassword } from './passwordService'
import { PrismaUserRepository } from './prismaUserRepository'

export function createLoginApi(databaseUrl: string, startSession: SessionStarter) {
  const prisma = createPrismaClient(databaseUrl)
  const handle = createLoginHandler({
    startSession,
    users: new PrismaUserRepository(prisma),
    verifyPassword,
  })

  return {
    handle,
    close: () => prisma.$disconnect(),
  }
}
