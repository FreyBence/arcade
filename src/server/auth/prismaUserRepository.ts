import { Prisma, type PrismaClient } from '../../../generated/prisma/client'
import { DuplicateEmailError } from './registrationErrors'
import type { NewUserRecord, SafeUser, UserRepository } from './registrationTypes'

const SAFE_USER_SELECTION = {
  id: true,
  name: true,
  email: true,
  role: true,
  dinoCoins: true,
  createdAt: true,
  updatedAt: true,
} as const

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findIdByEmail(email: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } })
    return user?.id ?? null
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
}
