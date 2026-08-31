import type { SafeUser } from '../auth/registrationTypes'

export interface ProfileInput { name: string; email: string }

export interface ProfileUserRepository {
  updateProfile(userId: string, profile: ProfileInput): Promise<SafeUser | null>
}
