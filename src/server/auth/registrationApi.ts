import { createPrismaClient } from '../database/prisma'
import { hashPassword } from './passwordService'
import { PrismaUserRepository } from './prismaUserRepository'
import { createRegistrationHandler } from './registrationHandler'

export function createRegistrationApi(databaseUrl: string) {
  const prisma = createPrismaClient(databaseUrl)
  const handle = createRegistrationHandler({
    hashPassword,
    users: new PrismaUserRepository(prisma),
  })

  return {
    handle,
    close: () => prisma.$disconnect(),
  }
}
