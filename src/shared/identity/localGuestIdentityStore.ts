import { GUEST_ID_STORAGE_KEY } from './constants'
import type { GuestIdentityStore } from './guestIdentityTypes'

type GuestIdentityStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function createLocalGuestIdentityStore(
  storage: GuestIdentityStorage = localStorage,
): GuestIdentityStore {
  return {
    load: () => storage.getItem(GUEST_ID_STORAGE_KEY),
    save: (guestId) => storage.setItem(GUEST_ID_STORAGE_KEY, guestId),
    clear: () => storage.removeItem(GUEST_ID_STORAGE_KEY),
  }
}
