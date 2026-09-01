import { Prisma, type PrismaClient } from '../../../generated/prisma/client'
import type { AuthenticationUserRepository, CredentialUser } from './loginTypes'
import { DuplicateEmailError } from './registrationErrors'
import type { NewUserRecord, SafeUser, UserRepository } from './registrationTypes'
import type { AdminBootstrapRepository, NewAdminRecord } from './bootstrap'
import type { ProfileUserRepository, ProfileInput } from '../profile/profileTypes'
import type { PasswordChangeUserRepository } from './passwordChange'

const SAFE_USER_SELECTION = {
  id: true,
  name: true,
  email: true,
  role: true,
  dinoCoins: true,
  profileImage: true,
  createdAt: true,
  updatedAt: true,
} as const

export class PrismaUserRepository implements UserRepository, AuthenticationUserRepository, AdminBootstrapRepository, ProfileUserRepository, PasswordChangeUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findIdByEmail(email: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } })
    return user?.id ?? null
  }

  async findForAuthentication(email: string): Promise<CredentialUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { ...SAFE_USER_SELECTION, passwordHash: true },
    })
    return user?.passwordHash ? { ...user, passwordHash: user.passwordHash } : null
  }

  findSafeById(id: string): Promise<SafeUser | null> {
    return this.prisma.user.findUnique({ where: { id }, select: SAFE_USER_SELECTION })
  }

  async findPasswordHashById(id: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { passwordHash: true } })
    return user?.passwordHash ?? null
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<boolean> {
    const result = await this.prisma.user.updateMany({ where: { id }, data: { passwordHash } })
    return result.count === 1
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

  async updateProfile(id: string, profile: ProfileInput): Promise<SafeUser | null> {
    try {
      return await this.prisma.user.update({ where: { id }, data: profile, select: SAFE_USER_SELECTION })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicateEmailError()
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return null
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
