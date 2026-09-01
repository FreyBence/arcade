import { hasOnlyAllowedFields } from '../../auth/utils'

const MAX_DINO_COINS = 2_147_483_647

export class AdminDinoCoinsValidationError extends Error {
  constructor() { super('Dino Coin balance must be a non-negative integer.'); this.name = 'AdminDinoCoinsValidationError' }
}

export interface AdminDinoCoinsInput { userId: string; dinoCoins: number }

export function parseAdminDinoCoinsInput(value: unknown): AdminDinoCoinsInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AdminDinoCoinsValidationError()
  const input = value as Record<string, unknown>
  if (!hasOnlyAllowedFields(input, ['userId', 'dinoCoins'])) throw new AdminDinoCoinsValidationError()
  if (typeof input.userId !== 'string' || !input.userId.trim()) throw new AdminDinoCoinsValidationError()
  if (typeof input.dinoCoins !== 'number' || !Number.isInteger(input.dinoCoins) || input.dinoCoins < 0 || input.dinoCoins > MAX_DINO_COINS) throw new AdminDinoCoinsValidationError()
  return { userId: input.userId.trim(), dinoCoins: input.dinoCoins }
}
