import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AdminUsersPage } from './AdminUsersPage'
import type { ClientIdentityUser } from '../../shared/identity'

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
    const user = userEvent.setup()
    render(<AdminUsersPage client={{ search }} />)
    if (input.query) await user.type(screen.getByRole('searchbox', { name: 'Search users' }), input.query)
    if (expected.empty) await screen.findByRole('heading', { name: 'No users found' }); else await screen.findByRole('heading', { name: dino.name })
    expect({
      calls,
      name: screen.queryByRole('heading', { name: dino.name }) !== null,
      email: screen.queryByText(dino.email) !== null,
      role: screen.queryByText(dino.role) !== null,
      coins: screen.queryByText(String(dino.dinoCoins)) !== null,
      empty: screen.queryByRole('heading', { name: 'No users found' }) !== null,
    }).toEqual(expected)
  })
})
