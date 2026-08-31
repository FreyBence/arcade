import { createGuestIdentityService } from './guestIdentityService'
import type {
  ClientIdentityState,
  ClientIdentityUser,
  GuestIdGenerator,
  GuestIdentityStore,
} from './guestIdentityTypes'

export interface ClientIdentitySession {
  restore(): Promise<ClientIdentityUser | null>
  logout(): Promise<void>
}

export interface ClientIdentityStore {
  getState(): ClientIdentityState
  subscribe(listener: () => void): () => void
  initialize(): Promise<void>
  login(user: ClientIdentityUser): void
  updateUser(user: ClientIdentityUser): void
  logout(): Promise<void>
}

interface ClientIdentityDependencies {
  session: ClientIdentitySession
  guestStore: GuestIdentityStore
  generateGuestId?: GuestIdGenerator
}

export function createClientIdentityStore({
  session,
  guestStore,
  generateGuestId,
}: ClientIdentityDependencies): ClientIdentityStore {
  const guestIdentities = createGuestIdentityService(guestStore, generateGuestId)
  const listeners = new Set<() => void>()
  let state: ClientIdentityState = { status: 'initializing' }
  let initialization: Promise<void> | null = null

  function setState(nextState: ClientIdentityState) {
    state = nextState
    listeners.forEach((listener) => listener())
  }

  function resolveGuest(): ClientIdentityState {
    const identity = guestIdentities.resolve(null)
    if (identity.kind !== 'guest') throw new Error('Guest identity resolution returned an authenticated identity.')
    return { status: 'guest', guestId: identity.guestId }
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    initialize() {
      initialization ??= session.restore().then((user) => {
        setState(user ? { status: 'authenticated', user } : resolveGuest())
      })
      return initialization
    },
    login(user) {
      setState({ status: 'authenticated', user })
    },
    updateUser(user) {
      setState({ status: 'authenticated', user })
    },
    async logout() {
      await session.logout()
      setState(resolveGuest())
    },
  }
}
