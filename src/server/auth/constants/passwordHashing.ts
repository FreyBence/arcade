import { argon2id, type HashOptions } from 'argon2'

export const PASSWORD_HASH_OPTIONS = Object.freeze({
  type: argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
} satisfies HashOptions)
