import type { UserRole } from '../../shared/auth'

export interface RegistrationInput {
  name: string
  email: string
  password: string
}

export interface NewUserRecord {
  name: string
  email: string
  passwordHash: string
}

export interface SafeUser {
  id: string
  name: string
  email: string
  role: UserRole
  dinoCoins: number
  createdAt: Date
  updatedAt: Date
}

export interface UserRepository {
  findIdByEmail(email: string): Promise<string | null>
  create(user: NewUserRecord): Promise<SafeUser>
}

export interface PasswordHasher {
  (plaintextPassword: string): Promise<string>
}
