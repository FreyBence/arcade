import { describe, expect, it, vi } from 'vitest'
import { createClientIdentityStore } from './clientIdentityStore'
import type { ClientIdentityUser, GuestIdentityStore } from './guestIdentityTypes'

const GUEST_ID = '0198f8f2-8ad8-7000-8000-000000000049'
const USER: ClientIdentityUser = {
  id: '0198f8f2-8ad8-7000-8000-000000000001',
  name: 'Dino Player',
  email: 'player@example.com',
  role: 'VIEWER',
  dinoCoins: 12,
}

function createDependencies(restoredUser: ClientIdentityUser | null, storedGuestId: string | null = GUEST_ID) {
  let guestId = storedGuestId
  const guestStore: GuestIdentityStore = {
    load: vi.fn(() => guestId),
    save: vi.fn((value: string) => { guestId = value }),
    clear: vi.fn(() => { guestId = null }),
  }
  const restore = vi.fn(() => Promise.resolve(restoredUser))
  const logout = vi.fn(() => Promise.resolve())
  const store = createClientIdentityStore({
    session: { restore, logout },
    guestStore,
    generateGuestId: () => GUEST_ID,
  })
  return { store, restore, logout }
}

const initializationCases = [
  {
    name: 'restores an authenticated session after initialization',
    input: { restoredUser: USER },
    expected: { status: 'authenticated', user: USER },
  },
  {
    name: 'restores the persisted guest when no authenticated session exists',
    input: { restoredUser: null },
    expected: { status: 'guest', guestId: GUEST_ID },
  },
]

const transitionCases = [
  {
    name: 'moves from guest to authenticated after login',
    input: { transition: 'login' as const },
    expected: { status: 'authenticated', user: USER },
  },
  {
    name: 'moves from authenticated to the same persisted guest after logout',
    input: { transition: 'logout' as const },
    expected: { status: 'guest', guestId: GUEST_ID },
  },
]

describe('client identity store', () => {
  it.each(initializationCases)('$name', async ({ input, expected }) => {
    const { store, restore } = createDependencies(input.restoredUser)
    expect(store.getState()).toEqual({ status: 'initializing' })

    await Promise.all([store.initialize(), store.initialize()])

    expect(store.getState()).toEqual(expected)
    expect(restore).toHaveBeenCalledTimes(1)
  })

  it.each(transitionCases)('$name', async ({ input, expected }) => {
    const { store, logout } = createDependencies(input.transition === 'logout' ? USER : null)
    await store.initialize()

    if (input.transition === 'login') store.login(USER)
    else await store.logout()

    expect(store.getState()).toEqual(expected)
    expect(logout).toHaveBeenCalledTimes(input.transition === 'logout' ? 1 : 0)
  })

  const notificationCases = [
    {
      name: 'notifies subscribers when identity changes and stops after unsubscribe',
      input: { updatesBeforeUnsubscribe: 1 },
      expected: { listenerCalls: 1 },
    },
  ]

  it.each(notificationCases)('$name', ({ expected }) => {
    const { store } = createDependencies(null)
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    store.login(USER)
    unsubscribe()
    store.login({ ...USER, name: 'Updated Player' })

    expect({ listenerCalls: listener.mock.calls.length }).toEqual(expected)
  })
})
