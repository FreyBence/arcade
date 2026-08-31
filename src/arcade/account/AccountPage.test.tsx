import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ClientIdentityProvider, createClientIdentityStore, type ClientIdentityUser } from '../../shared/identity'
import { ToastProvider } from '../../shared/ui'
import { AccountPage } from './AccountPage'

const USER: ClientIdentityUser = { id: 'user-id', name: 'Dino Player', email: 'player@example.com', role: 'VIEWER', dinoCoins: 12, profileImage: null }
const cases = [{ name: 'uploads and persists a profile picture', input: { file: new File(['hello'], 'avatar.png', { type: 'image/png' }) }, expected: { image: 'data:image/png;base64,aGVsbG8=', toast: 'Profile updated.' } }]

describe('AccountPage picture upload', () => it.each(cases)('$name', async ({ input, expected }) => {
  const store = createClientIdentityStore({ session: { restore: () => Promise.resolve(USER), logout: () => Promise.resolve() }, guestStore: { load: () => null, save: vi.fn(), clear: vi.fn() } })
  await store.initialize(); const update = vi.fn((profile) => Promise.resolve({ ...USER, ...profile })); const user = userEvent.setup()
  render(<ClientIdentityProvider store={store}><ToastProvider defaultDuration={0}><AccountPage client={{ update }} /></ToastProvider></ClientIdentityProvider>)
  await user.upload(screen.getByLabelText('Profile picture'), input.file)
  expect(await screen.findByAltText('Profile preview')).toHaveAttribute('src', expected.image)
  await user.click(screen.getByRole('button', { name: 'Save changes' }))
  expect(update).toHaveBeenCalledWith({ name: USER.name, email: USER.email, profileImage: expected.image })
  expect(await screen.findByRole('status')).toHaveTextContent(expected.toast)
}))
