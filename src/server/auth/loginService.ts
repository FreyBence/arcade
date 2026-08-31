import { invalidCredentials } from './loginErrors'
import type { AuthenticationUserRepository, PasswordVerifier, SessionStarter } from './loginTypes'
import { parseLoginInput } from './loginValidation'
import type { SafeUser } from './registrationTypes'

const UNKNOWN_USER_PASSWORD_HASH = '$argon2id$v=19$m=19456,p=1,t=2$vkTorrCeUBF+f1AoNmS2OA$JrMvey8qNsjGp/O6jYyxP0v6U9otWgrDaQKUt7Q5a9k'

export interface LoginDependencies {
  startSession: SessionStarter
  users: AuthenticationUserRepository
  verifyPassword: PasswordVerifier
}

export async function loginUser(input: unknown, dependencies: LoginDependencies): Promise<SafeUser> {
  const login = parseLoginInput(input)
  const credentialUser = await dependencies.users.findForAuthentication(login.email)
  const passwordMatches = await dependencies.verifyPassword(
    login.password,
    credentialUser?.passwordHash ?? UNKNOWN_USER_PASSWORD_HASH,
  )

  if (!credentialUser || !passwordMatches) throw invalidCredentials()

  const safeUser: SafeUser = {
    id: credentialUser.id,
    name: credentialUser.name,
    email: credentialUser.email,
    role: credentialUser.role,
    dinoCoins: credentialUser.dinoCoins,
    createdAt: credentialUser.createdAt,
    updatedAt: credentialUser.updatedAt,
  }
  await dependencies.startSession(safeUser)
  return safeUser
}
