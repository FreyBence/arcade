import { PasswordChangeError } from './passwordChangeErrors'
import type { PasswordChangeDependencies, PasswordChangeInput } from './passwordChangeTypes'

export async function changePassword(userId: string, input: PasswordChangeInput, dependencies: PasswordChangeDependencies): Promise<boolean> {
  const currentHash = await dependencies.users.findPasswordHashById(userId)
  if (!currentHash || !await dependencies.verifyPassword(input.currentPassword, currentHash)) {
    throw new PasswordChangeError('INCORRECT_CURRENT_PASSWORD', 'The current password is incorrect.')
  }
  const passwordHash = await dependencies.hashPassword(input.newPassword)
  return dependencies.users.updatePasswordHash(userId, passwordHash)
}
