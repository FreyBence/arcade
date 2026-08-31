import { GUEST_ID_PATTERN } from './constants'
import type {
  AuthenticatedClientIdentity,
  GuestIdGenerator,
  GuestIdentityStore,
  ResolvedClientIdentity,
} from './guestIdentityTypes'

export function generateGuestId(): string {
  return crypto.randomUUID()
}

export function isGuestId(value: unknown): value is string {
  return typeof value === 'string' && GUEST_ID_PATTERN.test(value)
}

export function createGuestIdentityService(
  store: GuestIdentityStore,
  generateId: GuestIdGenerator = generateGuestId,
) {
  return {
    resolve(authenticatedIdentity: AuthenticatedClientIdentity | null): ResolvedClientIdentity {
      if (authenticatedIdentity) return authenticatedIdentity

      const existingGuestId = store.load()
      if (isGuestId(existingGuestId)) return { kind: 'guest', guestId: existingGuestId }

      const guestId = generateId()
      if (!isGuestId(guestId)) throw new Error('Guest ID generator must return a valid UUID.')
      store.save(guestId)
      return { kind: 'guest', guestId }
    },
  }
}
