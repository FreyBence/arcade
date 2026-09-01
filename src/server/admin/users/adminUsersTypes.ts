import type { SafeUser } from '../../auth/registrationTypes'

export type AdminUser = Pick<SafeUser, 'id' | 'name' | 'email' | 'role' | 'dinoCoins' | 'profileImage'>

export interface AdminUserRepository {
  search(query: string): Promise<AdminUser[]>
}
