import { Prisma, type PrismaClient } from '../../../generated/prisma/client'
import type { AuthenticationUserRepository, CredentialUser } from './loginTypes'
import { DuplicateEmailError } from './registrationErrors'
import type { NewUserRecord, SafeUser, UserRepository } from './registrationTypes'
import type { AdminBootstrapRepository, NewAdminRecord } from './bootstrap'

const SAFE_USER_SELECTION = {
  id: true,
  name: true,
  email: true,
  role: true,
  dinoCoins: true,
  createdAt: true,
  updatedAt: true,
} as const

export class PrismaUserRepository implements UserRepository, AuthenticationUserRepository, AdminBootstrapRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findIdByEmail(email: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } })
    return user?.id ?? null
  }

  async findForAuthentication(email: string): Promise<CredentialUser | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { ...SAFE_USER_SELECTION, passwordHash: true },
    })
  }

  findSafeById(id: string): Promise<SafeUser | null> {
    return this.prisma.user.findUnique({ where: { id }, select: SAFE_USER_SELECTION })
  }

  async create(user: NewUserRecord): Promise<SafeUser> {
    try {
      return await this.prisma.user.create({ data: user, select: SAFE_USER_SELECTION })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicateEmailError()
      }
      throw error
    }
  }

  async upsertAdmin(admin: NewAdminRecord): Promise<SafeUser> {
    return this.prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: admin,
      select: SAFE_USER_SELECTION,
    })
  }
}
