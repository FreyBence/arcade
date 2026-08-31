import { createContext } from 'react'
import type { ClientIdentityState, ClientIdentityUser } from './guestIdentityTypes'

export interface ClientIdentityContextValue {
  state: ClientIdentityState
  login(user: ClientIdentityUser): void
  updateUser(user: ClientIdentityUser): void
  logout(): Promise<void>
}

export const ClientIdentityContext = createContext<ClientIdentityContextValue | null>(null)
