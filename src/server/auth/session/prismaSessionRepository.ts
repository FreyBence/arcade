import type { PrismaClient } from '../../../../generated/prisma/client'
import type { AuthenticationSession, AuthenticationSessionRepository, NewAuthenticationSession } from './sessionTypes'

const SESSION_SELECTION = {
  id: true,
  userId: true,
  expiresAt: true,
  revokedAt: true,
  createdAt: true,
} as const

export class PrismaSessionRepository implements AuthenticationSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(session: NewAuthenticationSession): Promise<AuthenticationSession> {
    return this.prisma.session.create({ data: session, select: SESSION_SELECTION })
  }

  revoke(id: string, revokedAt: Date): Promise<AuthenticationSession> {
    return this.prisma.session.update({
      where: { id },
      data: { revokedAt },
      select: SESSION_SELECTION,
    })
  }
}
