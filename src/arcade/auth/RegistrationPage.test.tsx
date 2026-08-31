import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ClientIdentityUser } from '../../shared/identity'
import { ClientIdentityProvider, createClientIdentityStore } from '../../shared/identity'
import type { GuestIdentityStore } from '../../shared/identity'
import { RegistrationPage } from './RegistrationPage'
import { RegistrationClientError, createBrowserRegistrationClient, type RegistrationClient } from './registrationClient'

const USER: ClientIdentityUser = { id: 'user-id', name: 'Dino Player', email: 'player@example.com', role: 'VIEWER', dinoCoins: 0, profileImage: null }
const VALID_INPUT = { name: 'Dino Player', email: 'player@example.com', password: 'safe-password' }

function renderPage(register: RegistrationClient['register']) {
  const guestStore: GuestIdentityStore = { load: () => '0198f8f2-8ad8-7000-8000-000000000050', save: vi.fn(), clear: vi.fn() }
  const store = createClientIdentityStore({
    session: { restore: () => Promise.resolve(null), logout: () => Promise.resolve() },
    guestStore,
  })
  render(<ClientIdentityProvider store={store}><RegistrationPage client={{ register }} /></ClientIdentityProvider>)
  return store
}

async function submit(input: { name: string; email: string; password: string }) {
  const user = userEvent.setup()
  if (input.name) await user.type(screen.getByLabelText('Name'), input.name)
  if (input.email) await user.type(screen.getByLabelText('Email'), input.email)
  if (input.password) await user.type(screen.getByLabelText('Password'), input.password)
  await user.click(screen.getByRole('button', { name: 'Create account' }))
}

const formCases = [
  {
    name: 'shows understandable client validation without sending invalid input',
    input: { fields: { name: '', email: 'invalid', password: 'short' }, outcome: 'success' as const },
    expected: { errors: ['Enter your name.', 'Enter a valid email address.', 'Use at least 8 characters.'], calls: 0, state: 'guest' },
  },
  {
    name: 'shows a safe duplicate-account error',
    input: { fields: VALID_INPUT, outcome: 'duplicate' as const },
    expected: { errors: ['An account with this email already exists.'], calls: 1, state: 'guest' },
  },
  {
    name: 'updates client identity after registration and automatic sign-in',
    input: { fields: VALID_INPUT, outcome: 'success' as const },
    expected: { errors: [], calls: 1, state: 'authenticated' },
  },
]

describe('registration page', () => {
  it.each(formCases)('$name', async ({ input, expected }) => {
    const register = vi.fn(() => input.outcome === 'duplicate'
      ? Promise.reject(new RegistrationClientError('DUPLICATE_EMAIL'))
      : Promise.resolve(USER))
    const store = renderPage(register)
    await screen.findByRole('heading', { name: 'Join the arcade' })
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeVisible()

    await submit(input.fields)

    for (const message of expected.errors) expect(await screen.findByText(message)).toBeVisible()
    expect(register).toHaveBeenCalledTimes(expected.calls)
    expect(store.getState().status).toBe(expected.state)
  })
})

const clientCases = [
  {
    name: 'sends only registration fields then signs the new user in',
    input: VALID_INPUT,
    expected: {
      paths: ['/api/register', '/api/login'],
      bodies: [VALID_INPUT, { email: VALID_INPUT.email, password: VALID_INPUT.password }],
      user: USER,
    },
  },
]

describe('browser registration client', () => {
  it.each(clientCases)('$name', async ({ input, expected }) => {
    const requests: Array<{ path: string; body: unknown }> = []
    let requestNumber = 0
    const fetcher: typeof fetch = vi.fn((path: string | URL | Request, init?: RequestInit) => {
      const requestPath = typeof path === 'string' ? path : path instanceof URL ? path.href : path.url
      const body = typeof init?.body === 'string' ? JSON.parse(init.body) as unknown : null
      requests.push({ path: requestPath, body })
      requestNumber += 1
      return Promise.resolve(requestNumber === 1
        ? Response.json({ user: USER }, { status: 201 })
        : Response.json({ user: USER, accessToken: 'token' }))
    })

    await expect(createBrowserRegistrationClient(fetcher).register(input)).resolves.toEqual(expected.user)
    expect(requests.map(({ path }) => path)).toEqual(expected.paths)
    expect(requests.map(({ body }) => body)).toEqual(expected.bodies)
  })
})
