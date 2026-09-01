import type { PrismaClient } from '../../../../generated/prisma/client'
import type { UserRole } from '../../../shared/auth'
import type { AdminRoleRepository, AdminUserRepository } from './adminUsersTypes'

const ADMIN_USER_SELECTION = { id: true, name: true, email: true, role: true, dinoCoins: true, profileImage: true } as const

export class PrismaAdminUserRepository implements AdminUserRepository, AdminRoleRepository {
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
      select: ADMIN_USER_SELECTION,
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
    })
  }

  async setDinoCoins(userId: string, dinoCoins: number) {
    const result = await this.prisma.user.updateMany({ where: { id: userId }, data: { dinoCoins } })
    if (result.count === 0) return null
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: ADMIN_USER_SELECTION,
    })
  }

  setRole(userId: string, role: UserRole) {
    return this.prisma.$transaction(async (transaction) => {
      const target = await transaction.user.findUnique({ where: { id: userId }, select: { role: true } })
      if (!target) return { status: 'not-found' } as const
      if (target.role === 'ADMIN' && role === 'VIEWER') {
        const administratorCount = await transaction.user.count({ where: { role: 'ADMIN' } })
        if (administratorCount <= 1) return { status: 'last-admin' } as const
      }
      const user = await transaction.user.update({ where: { id: userId }, data: { role }, select: ADMIN_USER_SELECTION })
      return { status: 'updated', user } as const
    }, { isolationLevel: 'Serializable' })
  }
}
