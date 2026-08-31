import type { PrismaClient } from '../../../../generated/prisma/client'
import type { SafeUser } from '../registrationTypes'
import type { GoogleUserRepository, VerifiedGoogleIdentity } from './googleTypes'

const SAFE_USER_SELECTION = { id: true, name: true, email: true, role: true, dinoCoins: true, createdAt: true, updatedAt: true } as const
const GOOGLE_PROVIDER = 'GOOGLE'

export class PrismaGoogleUserRepository implements GoogleUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  resolve(identity: VerifiedGoogleIdentity): Promise<SafeUser> {
    return this.prisma.$transaction(async (transaction) => {
      const linkedIdentity = await transaction.externalIdentity.findUnique({
        where: { provider_providerSubject: { provider: GOOGLE_PROVIDER, providerSubject: identity.subject } },
        select: { user: { select: SAFE_USER_SELECTION } },
      })
      if (linkedIdentity) return linkedIdentity.user

      const existingUser = await transaction.user.findUnique({ where: { email: identity.email }, select: { ...SAFE_USER_SELECTION, emailVerifiedAt: true } })
      if (existingUser) {
        await transaction.externalIdentity.create({
          data: { userId: existingUser.id, provider: GOOGLE_PROVIDER, providerSubject: identity.subject },
        })
        if (!existingUser.emailVerifiedAt) {
          await transaction.user.update({ where: { id: existingUser.id }, data: { emailVerifiedAt: new Date() } })
        }
        return {
          id: existingUser.id, name: existingUser.name, email: existingUser.email, role: existingUser.role,
          dinoCoins: existingUser.dinoCoins, createdAt: existingUser.createdAt, updatedAt: existingUser.updatedAt,
        }
      }

      return transaction.user.create({
        data: {
          name: identity.name,
          email: identity.email,
          emailVerifiedAt: new Date(),
          role: 'VIEWER',
          dinoCoins: 0,
          externalIdentities: { create: { provider: GOOGLE_PROVIDER, providerSubject: identity.subject } },
        },
        select: SAFE_USER_SELECTION,
      })
    })
  }
}
