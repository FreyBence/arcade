import type { PrismaClient } from '../../../../generated/prisma/client'
import type { AdminUserRepository } from './adminUsersTypes'

export class PrismaAdminUserRepository implements AdminUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  search(query: string) {
    const search = query.trim()
    return this.prisma.user.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : undefined,
      select: { id: true, name: true, email: true, role: true, dinoCoins: true, profileImage: true },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
    })
  }
}
