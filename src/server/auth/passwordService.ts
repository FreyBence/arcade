import { hash, verify } from 'argon2'
import { PASSWORD_HASH_OPTIONS } from './passwordConfig'

export async function hashPassword(plaintextPassword: string): Promise<string> {
  return hash(plaintextPassword, PASSWORD_HASH_OPTIONS)
}

export async function verifyPassword(plaintextPassword: string, passwordHash: string): Promise<boolean> {
  try {
    return await verify(passwordHash, plaintextPassword)
  } catch {
    return false
  }
}
