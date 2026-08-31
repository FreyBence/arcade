import 'dotenv/config'
import { createPrismaClient } from '../../database/prisma'
import { hashPassword } from '../passwordService'
import { PrismaUserRepository } from '../prismaUserRepository'
import { bootstrapAdmin, readAdminBootstrapConfig } from './adminBootstrap'

async function main() {
  const config = readAdminBootstrapConfig(process.env)
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required to bootstrap the administrator.')

  const prisma = createPrismaClient(databaseUrl)
  try {
    const user = await bootstrapAdmin(config, {
      hashPassword,
      users: new PrismaUserRepository(prisma),
    })
    process.stdout.write(`Administrator ready: ${user.email}\n`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Administrator bootstrap failed.'
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
