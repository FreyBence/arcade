import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GameCard } from './GameCard'

const cases = [
  { name: 'renders metadata without selecting', input: { action: 'render', game: { id: 'puzzle', title: 'Pocket Puzzle', description: 'Match tiles.', icon: '◆' } }, expected: { selectedId: undefined } },
  { name: 'supports pointer activation', input: { action: 'click', game: { id: 'runner', title: 'Tiny Runner', description: 'Keep moving.', icon: '▲' } }, expected: { selectedId: 'runner' } },
  { name: 'supports keyboard activation', input: { action: 'keyboard', game: { id: 'maze', title: 'Mini Maze', description: 'Find the exit.', icon: '●' } }, expected: { selectedId: 'maze' } },
]

describe('GameCard', () => {
  it.each(cases)('$name', async ({ input, expected }) => {
    const user = userEvent.setup()
    let selectedId: string | undefined
    const onSelect = (gameId: string) => { selectedId = gameId }
    render(<GameCard game={input.game} onSelect={onSelect} />)
    const card = screen.getByRole('button', { name: `Play ${input.game.title}` })
    if (input.action === 'click') await user.click(card)
    if (input.action === 'keyboard') { card.focus(); await user.keyboard('{Enter}') }
    expect({
      title: screen.getByText(input.game.title).textContent,
      description: screen.getByText(input.game.description).textContent,
      icon: screen.getByText(input.game.icon).textContent,
      selectedId,
    }).toEqual({ ...expected, title: input.game.title, description: input.game.description, icon: input.game.icon })
  })
})
