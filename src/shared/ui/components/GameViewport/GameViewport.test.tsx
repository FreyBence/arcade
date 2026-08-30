import { render } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { GameViewport } from './GameViewport'

const cases = [
  { name: 'provides an active canvas container', input: { active: true, fullscreen: false }, expected: { className: 'game-viewport game-viewport--active' } },
  { name: 'keeps an inactive runtime container mounted', input: { active: false, fullscreen: false }, expected: { className: 'game-viewport' } },
  { name: 'applies the explicit fullscreen variant', input: { active: true, fullscreen: true }, expected: { className: 'game-viewport game-viewport--active game-viewport--fullscreen' } },
]

describe('GameViewport', () => {
  it.each(cases)('$name', ({ input, expected }) => {
    const ref = createRef<HTMLDivElement>()
    render(<GameViewport ref={ref} active={input.active} fullscreen={input.fullscreen} />)
    expect(ref.current).toHaveClass(...expected.className.split(' '))
  })
})
