import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GameErrorState, GameLoadingState } from './GameHostState'

const cases = [
  { name: 'announces loading progress', input: { state: 'loading' as const }, expected: { role: 'status', text: 'Loading game…' } },
  { name: 'announces a loading failure', input: { state: 'error' as const }, expected: { role: 'alert', text: 'The game could not be loaded. Return to the arcade and try again.' } },
]

describe('game host states', () => {
  it.each(cases)('$name', ({ input, expected }) => {
    render(input.state === 'loading' ? <GameLoadingState /> : <GameErrorState />)
    expect(screen.getByRole(expected.role)).toHaveTextContent(expected.text)
  })
})
