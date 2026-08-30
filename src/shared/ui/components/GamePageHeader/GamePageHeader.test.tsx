import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GamePageHeader } from './GamePageHeader'

const cases = [
  { name: 'displays the application-owned game identity', input: { icon: 'S', title: 'Snake' }, expected: { title: 'Snake', icon: 'S' } },
]

describe('GamePageHeader', () => {
  it.each(cases)('$name', ({ input, expected }) => {
    render(<GamePageHeader {...input} />)
    expect(screen.getByRole('heading', { name: expected.title })).toBeInTheDocument()
    expect(screen.getByText(expected.icon)).toHaveAttribute('aria-hidden', 'true')
  })
})
