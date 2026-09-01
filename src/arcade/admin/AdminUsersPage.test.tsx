import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AdminUsersPage } from './AdminUsersPage'
import type { ClientIdentityUser } from '../../shared/identity'
import { ToastProvider } from '../../shared/ui'

const dino = { id: 'one', name: 'Dino Player', email: 'dino@example.com', role: 'VIEWER' as const, dinoCoins: 42, profileImage: null }
type PageCase = { name: string; input: { results: ClientIdentityUser[][]; query?: string }; expected: { calls: string[]; name: boolean; email: boolean; role: boolean; coins: boolean; empty: boolean } }
const cases: PageCase[] = [
  { name: 'lists user identity, role, and balance', input: { results: [[dino]], query: undefined }, expected: { calls: [''], name: true, email: true, role: true, coins: true, empty: false } },
  { name: 'searches with the single name or email field', input: { results: [[dino], []], query: 'rex@arcade.test' }, expected: { calls: ['', 'r', 're', 'rex', 'rex@', 'rex@a', 'rex@ar', 'rex@arc', 'rex@arca', 'rex@arcad', 'rex@arcade', 'rex@arcade.', 'rex@arcade.t', 'rex@arcade.te', 'rex@arcade.tes', 'rex@arcade.test'], name: false, email: false, role: false, coins: false, empty: true } },
  { name: 'shows the empty state for an empty user list', input: { results: [[]], query: undefined }, expected: { calls: [''], name: false, email: false, role: false, coins: false, empty: true } },
]

describe('AdminUsersPage', () => {
  it.each(cases)('$name', async ({ input, expected }) => {
    const calls: string[] = []
    const search = vi.fn((query: string) => { calls.push(query); return Promise.resolve(query ? input.results.at(-1) ?? [] : input.results[0] ?? []) })
    const updateDinoCoins = vi.fn()
    const updateRole = vi.fn()
    const user = userEvent.setup()
    render(<ToastProvider><AdminUsersPage client={{ search, updateDinoCoins, updateRole }} /></ToastProvider>)
    if (input.query) await user.type(screen.getByRole('searchbox', { name: 'Search users' }), input.query)
    if (expected.empty) await screen.findByRole('heading', { name: 'No users found' }); else await screen.findByRole('heading', { name: dino.name })
    expect({
      calls,
      name: screen.queryByRole('heading', { name: dino.name }) !== null,
      email: screen.queryByText(dino.email) !== null,
      role: screen.queryByText(dino.role) !== null,
      coins: screen.queryByRole('spinbutton', { name: 'Dino Coins' })?.getAttribute('value') === String(dino.dinoCoins),
      empty: screen.queryByRole('heading', { name: 'No users found' }) !== null,
    }).toEqual(expected)
  })
})

const balanceCases = [
  { name: 'saves and reflects a new Dino Coin balance', input: { balance: '250', succeeds: true }, expected: { update: ['one', 250], value: '250', error: undefined } },
  { name: 'rejects a negative balance before sending it', input: { balance: '-1', succeeds: true }, expected: { update: undefined, value: '-1', error: 'Enter a non-negative whole number.' } },
  { name: 'rejects an empty balance before sending it', input: { balance: '', succeeds: true }, expected: { update: undefined, value: '', error: 'Enter a non-negative whole number.' } },
  { name: 'keeps the entered balance and reports a server failure', input: { balance: '250', succeeds: false }, expected: { update: ['one', 250], value: '250', error: 'The Dino Coin balance could not be updated. Please try again.' } },
]

describe('AdminUsersPage Dino Coin management', () => {
  it.each(balanceCases)('$name', async ({ input, expected }) => {
    const updates: [string, number][] = []
    const updateDinoCoins = vi.fn((userId: string, balance: number) => {
      updates.push([userId, balance])
      return input.succeeds ? Promise.resolve({ ...dino, dinoCoins: balance }) : Promise.reject(new Error('unavailable'))
    })
    const user = userEvent.setup()
    render(<ToastProvider><AdminUsersPage client={{ search: () => Promise.resolve([dino]), updateDinoCoins, updateRole: vi.fn() }} /></ToastProvider>)
    const inputControl = await screen.findByRole('spinbutton', { name: 'Dino Coins' })
    await user.clear(inputControl)
    if (input.balance) await user.type(inputControl, input.balance)
    await user.click(screen.getByRole('button', { name: 'Save balance' }))
    if (expected.error) await screen.findByRole('alert')
    else await screen.findByText(`Updated ${dino.name}'s Dino Coin balance.`)
    expect({ update: updates[0], value: inputControl.getAttribute('value'), error: screen.queryByRole('alert')?.textContent }).toEqual(expected)
  })
})

describe('AdminUsersPage role management', () => {
  it('promotes a viewer and refreshes the displayed role', async () => {
    const updateRole = vi.fn((userId: string) => Promise.resolve({ ...dino, id: userId, role: 'ADMIN' as const }))
    const user = userEvent.setup()
    render(<ToastProvider><AdminUsersPage client={{ search: () => Promise.resolve([dino]), updateDinoCoins: vi.fn(), updateRole }} /></ToastProvider>)
    const role = await screen.findByRole('combobox', { name: 'Role' })
    await user.selectOptions(role, 'ADMIN')
    await user.click(screen.getByRole('button', { name: 'Save role' }))
    await screen.findByText(`Updated ${dino.name}'s role to ADMIN.`)
    expect({ call: updateRole.mock.calls[0], value: (role as HTMLSelectElement).value, guestOption: screen.queryByRole('option', { name: /guest/i }) }).toEqual({ call: ['one', 'ADMIN'], value: 'ADMIN', guestOption: null })
  })
})
