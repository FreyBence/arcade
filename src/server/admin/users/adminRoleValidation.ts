import { isUserRole, type UserRole } from '../../../shared/auth'
import { hasOnlyAllowedFields } from '../../auth/utils'

export class AdminRoleValidationError extends Error {
  constructor() { super('Select either the ADMIN or VIEWER role.'); this.name = 'AdminRoleValidationError' }
}

export interface AdminRoleInput { userId: string; role: UserRole }

export function parseAdminRoleInput(input: unknown): AdminRoleInput {
  if (typeof input !== 'object' || input === null || Array.isArray(input) || !hasOnlyAllowedFields(input as Record<string, unknown>, ['userId', 'role'])) throw new AdminRoleValidationError()
  const record = input as Record<string, unknown>
  if (typeof record.userId !== 'string' || !record.userId.trim() || !isUserRole(record.role)) throw new AdminRoleValidationError()
  return { userId: record.userId.trim(), role: record.role }
}
