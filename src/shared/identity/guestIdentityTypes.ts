import type { UserRole } from '../auth'

export interface GuestIdentity {
  kind: 'guest'
  guestId: string
}

export interface AuthenticatedClientIdentity {
  kind: 'authenticated'
  userId: string
  role: UserRole
}

export type ResolvedClientIdentity = GuestIdentity | AuthenticatedClientIdentity

export interface ClientIdentityUser {
  id: string
  name: string
  email: string
  role: UserRole
  dinoCoins: number
}

export type ClientIdentityState =
  | { status: 'initializing' }
  | { status: 'guest'; guestId: string }
  | { status: 'authenticated'; user: ClientIdentityUser }

export interface GuestIdentityStore {
  load(): string | null
  save(guestId: string): void
  clear(): void
}

export interface GuestIdGenerator {
  (): string
}
