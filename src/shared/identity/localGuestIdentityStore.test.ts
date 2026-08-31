import { beforeEach, describe, expect, it } from 'vitest'
import { GUEST_ID_STORAGE_KEY } from './constants'
import { createGuestIdentityService } from './guestIdentityService'
import { createLocalGuestIdentityStore } from './localGuestIdentityStore'

const GUEST_ID = '0198f8f2-8ad8-7000-8000-000000000048'

const storageCases = [
  {
    name: 'saves and loads a guest identity',
    input: { operation: 'save-and-load' as const, initialGuestId: null },
    expected: { loadedGuestId: GUEST_ID, storedGuestId: GUEST_ID },
  },
  {
    name: 'loads an existing guest identity after the store is recreated',
    input: { operation: 'load' as const, initialGuestId: GUEST_ID },
    expected: { loadedGuestId: GUEST_ID, storedGuestId: GUEST_ID },
  },
  {
    name: 'clears the locally stored guest identity',
    input: { operation: 'clear' as const, initialGuestId: GUEST_ID },
    expected: { loadedGuestId: null, storedGuestId: null },
  },
]

const restorationCases = [
  {
    name: 'restores the persisted identity instead of generating another one',
    input: { storedGuestId: GUEST_ID },
    expected: {
      identity: { kind: 'guest', guestId: GUEST_ID },
      generatorCalls: 0,
    },
  },
]

beforeEach(() => localStorage.clear())

describe('local guest identity store', () => {
  it.each(storageCases)('$name', ({ input, expected }) => {
    if (input.initialGuestId) localStorage.setItem(GUEST_ID_STORAGE_KEY, input.initialGuestId)

    const store = createLocalGuestIdentityStore()
    if (input.operation === 'save-and-load') store.save(GUEST_ID)
    if (input.operation === 'clear') store.clear()

    expect({
      loadedGuestId: createLocalGuestIdentityStore().load(),
      storedGuestId: localStorage.getItem(GUEST_ID_STORAGE_KEY),
    }).toEqual(expected)
  })

  it.each(restorationCases)('$name', ({ input, expected }) => {
    localStorage.setItem(GUEST_ID_STORAGE_KEY, input.storedGuestId)
    let generatorCalls = 0
    const identity = createGuestIdentityService(createLocalGuestIdentityStore(), () => {
      generatorCalls += 1
      return '0198f8f2-8ad8-7000-8000-000000000049'
    }).resolve(null)

    expect({ identity, generatorCalls }).toEqual(expected)
  })
})
