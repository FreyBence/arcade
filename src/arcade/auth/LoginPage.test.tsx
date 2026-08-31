import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ClientIdentityProvider, createClientIdentityStore, type ClientIdentityUser, type GuestIdentityStore } from '../../shared/identity'
import { deferred } from '../../test/testUtils'
import { LoginPage } from './LoginPage'
import { createBrowserLoginClient, LoginClientError, type LoginClient } from './loginClient'

const GUEST_ID = '0198f8f2-8ad8-7000-8000-000000000051'
const USER: ClientIdentityUser = { id: 'user-id', name: 'Dino Player', email: 'player@example.com', role: 'VIEWER', dinoCoins: 12 }
const VALID_INPUT = { email: 'player@example.com', password: 'safe-password' }

function renderPage(login: LoginClient['login']) {
  const clearGuest = vi.fn()
  const guestStore: GuestIdentityStore = { load: () => GUEST_ID, save: vi.fn(), clear: clearGuest }
  const store = createClientIdentityStore({
    session: { restore: () => Promise.resolve(null), logout: () => Promise.resolve() },
    guestStore,
  })
  render(<ClientIdentityProvider store={store}><LoginPage client={{ login }} /></ClientIdentityProvider>)
  return { store, clearGuest }
}

async function submit(input: { email: string; password: string }) {
  const user = userEvent.setup()
  if (input.email) await user.type(screen.getByLabelText('Email'), input.email)
  if (input.password) await user.type(screen.getByLabelText('Password'), input.password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

const formCases = [
  {
    name: 'shows required-field validation without sending a request',
    input: { fields: { email: '', password: '' }, outcome: 'success' as const },
    expected: { errors: ['Enter your email address.', 'Enter your password.'], calls: 0, state: 'guest' },
  },
  {
    name: 'shows a generic error for invalid credentials',
    input: { fields: VALID_INPUT, outcome: 'invalid' as const },
    expected: { errors: ['Email or password is incorrect.'], calls: 1, state: 'guest' },
  },
  {
    name: 'updates client identity while preserving stored guest identity',
    input: { fields: VALID_INPUT, outcome: 'success' as const },
    expected: { errors: [], calls: 1, state: 'authenticated' },
  },
]

describe('login page', () => {
  it.each(formCases)('$name', async ({ input, expected }) => {
    const login = vi.fn(() => input.outcome === 'invalid'
      ? Promise.reject(new LoginClientError('INVALID_CREDENTIALS'))
      : Promise.resolve(USER))
    const { store, clearGuest } = renderPage(login)
    await screen.findByRole('heading', { name: 'Sign in to the arcade' })
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeVisible()

    await submit(input.fields)

    for (const message of expected.errors) expect(await screen.findByText(message)).toBeVisible()
    expect(login).toHaveBeenCalledTimes(expected.calls)
    expect(store.getState().status).toBe(expected.state)
    expect(clearGuest).not.toHaveBeenCalled()
  })
})

const loadingCases = [{
  name: 'disables the form and displays progress while login is pending',
  input: VALID_INPUT,
  expected: { buttonName: 'Signing in', disabled: true },
}]

describe('login loading state', () => {
  it.each(loadingCases)('$name', async ({ input, expected }) => {
    const pending = deferred<ClientIdentityUser>()
    renderPage(() => pending.promise)
    await submit(input)

    expect(screen.getByRole('button', { name: expected.buttonName })).toBeDisabled()
    expect(screen.getByLabelText('Email')).toBeDisabled()
    pending.resolve(USER)
  })
})

const clientCases = [{
  name: 'sends only login credentials and returns the public user',
  input: VALID_INPUT,
  expected: { path: '/api/login', body: VALID_INPUT, user: USER },
}]

describe('browser login client', () => {
  it.each(clientCases)('$name', async ({ input, expected }) => {
    let request: { path: string; body: unknown } | undefined
    const fetcher: typeof fetch = vi.fn((path: string | URL | Request, init?: RequestInit) => {
      request = {
        path: typeof path === 'string' ? path : path instanceof URL ? path.href : path.url,
        body: typeof init?.body === 'string' ? JSON.parse(init.body) as unknown : null,
      }
      return Promise.resolve(Response.json({ user: USER, accessToken: 'private-token' }))
    })

    await expect(createBrowserLoginClient(fetcher).login(input)).resolves.toEqual(expected.user)
    expect(request).toEqual({ path: expected.path, body: expected.body })
  })
})
