import { UNKNOWN_USER_PASSWORD_HASH } from './constants'
import { invalidCredentials } from './loginErrors'
import type { AuthenticationUserRepository, LoginResult, PasswordVerifier, SessionStarter } from './loginTypes'
import { parseLoginInput } from './loginValidation'
import type { SafeUser } from './registrationTypes'

export interface LoginDependencies {
  startSession: SessionStarter
  users: AuthenticationUserRepository
  verifyPassword: PasswordVerifier
}

export async function loginUser(input: unknown, dependencies: LoginDependencies): Promise<LoginResult> {
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
  const session = await dependencies.startSession(safeUser)
  return { user: safeUser, ...session }
}
