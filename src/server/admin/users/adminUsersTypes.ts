import type { SafeUser } from '../../auth/registrationTypes'
import type { UserRole } from '../../../shared/auth'

export type AdminUser = Pick<SafeUser, 'id' | 'name' | 'email' | 'role' | 'dinoCoins' | 'profileImage'>

export interface AdminUserRepository {
  search(query: string): Promise<AdminUser[]>
  setDinoCoins(userId: string, dinoCoins: number): Promise<AdminUser | null>
}

export type AdminRoleUpdateResult =
  | { status: 'updated'; user: AdminUser }
  | { status: 'not-found' }
  | { status: 'last-admin' }

export interface AdminRoleRepository {
  setRole(userId: string, role: UserRole): Promise<AdminRoleUpdateResult>
}
