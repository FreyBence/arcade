import { useContext } from 'react'
import { ClientIdentityContext, type ClientIdentityContextValue } from './clientIdentityContext'

export function useClientIdentity(): ClientIdentityContextValue {
  const identity = useContext(ClientIdentityContext)
  if (!identity) throw new Error('useClientIdentity must be used within ClientIdentityProvider.')
  return identity
}
