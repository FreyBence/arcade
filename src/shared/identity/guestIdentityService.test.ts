// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGuestIdentityService, generateGuestId, isGuestId } from './guestIdentityService'
import type { AuthenticatedClientIdentity, GuestIdentityStore } from './guestIdentityTypes'

const EXISTING_GUEST_ID = '0198f8f2-8ad8-7000-8000-000000000047'
const GENERATED_GUEST_ID = '0198f8f2-8ad8-7000-8000-000000000048'

function createStore(storedGuestId: string | null) {
  const load = vi.fn(() => storedGuestId)
  const save = vi.fn((guestId: string) => {
    void guestId
  })
  const store: GuestIdentityStore = { load, save }
  return { load, save, store }
}

const resolutionCases = [
  {
    name: 'automatically creates a guest identity for a first-time visitor',
    input: { storedGuestId: null, authenticatedIdentity: null },
    expected: {
      identity: { kind: 'guest', guestId: GENERATED_GUEST_ID },
      loadCalls: 1,
      generatorCalls: 1,
      savedGuestId: GENERATED_GUEST_ID,
    },
  },
  {
    name: 'reuses an existing valid local guest identity',
    input: { storedGuestId: EXISTING_GUEST_ID, authenticatedIdentity: null },
    expected: {
      identity: { kind: 'guest', guestId: EXISTING_GUEST_ID },
      loadCalls: 1,
      generatorCalls: 0,
      savedGuestId: null,
    },
  },
  {
    name: 'replaces an invalid local guest identity',
    input: { storedGuestId: 'not-a-uuid', authenticatedIdentity: null },
    expected: {
      identity: { kind: 'guest', guestId: GENERATED_GUEST_ID },
      loadCalls: 1,
      generatorCalls: 1,
      savedGuestId: GENERATED_GUEST_ID,
    },
  },
  {
    name: 'preserves authenticated identity without creating a guest',
    input: {
      storedGuestId: null,
      authenticatedIdentity: { kind: 'authenticated', userId: 'registered-user-id', role: 'VIEWER' as const },
    },
    expected: {
      identity: { kind: 'authenticated', userId: 'registered-user-id', role: 'VIEWER' },
      loadCalls: 0,
      generatorCalls: 0,
      savedGuestId: null,
    },
  },
]

const guestIdValidationCases = [
  { name: 'accepts a canonical UUID guest ID', input: EXISTING_GUEST_ID, expected: true },
  { name: 'rejects a non-UUID string', input: 'guest-123', expected: false },
  { name: 'rejects a non-string value', input: null, expected: false },
]

afterEach(() => vi.unstubAllGlobals())

describe('guest identity service', () => {
  it.each(resolutionCases)('$name', ({ input, expected }) => {
    const { load, save, store } = createStore(input.storedGuestId)
    const generateId = vi.fn(() => GENERATED_GUEST_ID)
    const identity = createGuestIdentityService(store, generateId).resolve(
      input.authenticatedIdentity as AuthenticatedClientIdentity | null,
    )

    expect({
      identity,
      loadCalls: load.mock.calls.length,
      generatorCalls: generateId.mock.calls.length,
      savedGuestId: save.mock.calls[0]?.[0] ?? null,
    }).toEqual(expected)
  })

  it.each(guestIdValidationCases)('$name', ({ input, expected }) => {
    expect(isGuestId(input)).toBe(expected)
  })

  const generationCases = [
    {
      name: 'generates guest IDs using the platform UUID generator',
      input: { generatedUuid: GENERATED_GUEST_ID },
      expected: GENERATED_GUEST_ID,
    },
  ]

  it.each(generationCases)('$name', ({ input, expected }) => {
    const randomUUID = vi.fn(() => input.generatedUuid)
    vi.stubGlobal('crypto', { randomUUID })

    expect(generateGuestId()).toBe(expected)
    expect(randomUUID).toHaveBeenCalledTimes(1)
  })
})
