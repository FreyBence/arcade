import { useEffect, useSyncExternalStore, type PropsWithChildren } from 'react'
import { ClientIdentityContext } from './clientIdentityContext'
import type { ClientIdentityStore } from './clientIdentityStore'

interface ClientIdentityProviderProps extends PropsWithChildren {
  store: ClientIdentityStore
}

export function ClientIdentityProvider({ children, store }: ClientIdentityProviderProps) {
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState(),
    () => store.getState(),
  )

  useEffect(() => {
    void store.initialize()
  }, [store])

  return (
    <ClientIdentityContext value={{
      state,
      login: (user) => store.login(user),
      logout: () => store.logout(),
    }}>
      {children}
    </ClientIdentityContext>
  )
}
