import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { GameDefinition } from '../../../../arcade/types'
import { GameCatalogue } from './GameCatalogue'

const load = vi.fn()
const games: readonly GameDefinition[] = [
  { id: 'one', title: 'Game One', description: 'First game', icon: '1', load },
  { id: 'two', title: 'Game Two', description: 'Second game', icon: '2', load },
]
const cases = [
  { name: 'renders every registry entry without loading runtimes', input: { selection: undefined }, expected: { names: ['Play Game One', 'Play Game Two'], selectedId: undefined } },
  { name: 'returns the selected registry definition', input: { selection: 'Game Two' }, expected: { names: ['Play Game One', 'Play Game Two'], selectedId: 'two' } },
]

describe('GameCatalogue', () => {
  it.each(cases)('$name', async ({ input, expected }) => {
    const user = userEvent.setup()
    let selectedId: string | undefined
    const onSelect = (game: GameDefinition) => { selectedId = game.id }
    load.mockClear()
    render(<GameCatalogue games={games} onSelect={onSelect} />)
    if (input.selection) await user.click(screen.getByRole('button', { name: `Play ${input.selection}` }))
    expect({ names: screen.getAllByRole('button').map((button) => button.getAttribute('aria-label')), selectedId }).toEqual(expected)
    expect(load).not.toHaveBeenCalled()
  })
})
