import { DuplicateEmailError } from './registrationErrors'
import { parseRegistrationInput } from './registrationValidation'
import type { PasswordHasher, SafeUser, UserRepository } from './registrationTypes'

export interface RegistrationDependencies {
  hashPassword: PasswordHasher
  users: UserRepository
}

export async function registerUser(input: unknown, dependencies: RegistrationDependencies): Promise<SafeUser> {
  const registration = parseRegistrationInput(input)
  if (await dependencies.users.findIdByEmail(registration.email)) throw new DuplicateEmailError()

  const passwordHash = await dependencies.hashPassword(registration.password)

  return dependencies.users.create({
    name: registration.name,
    email: registration.email,
    passwordHash,
  })
}
