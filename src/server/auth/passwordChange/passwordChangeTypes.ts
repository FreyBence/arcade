export interface PasswordChangeInput { currentPassword: string; newPassword: string }

export interface PasswordChangeUserRepository {
  findPasswordHashById(userId: string): Promise<string | null>
  updatePasswordHash(userId: string, passwordHash: string): Promise<boolean>
}

export interface PasswordChangeDependencies {
  users: PasswordChangeUserRepository
  verifyPassword(plaintextPassword: string, passwordHash: string): Promise<boolean>
  hashPassword(plaintextPassword: string): Promise<string>
}
