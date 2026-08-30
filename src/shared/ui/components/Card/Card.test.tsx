import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Card } from './Card'

const renderingCases = [
  {
    name: 'renders a static surface by default',
    input: { interactive: false as const, className: undefined },
    expected: { tagName: 'DIV', className: 'card', buttonCount: 0 },
  },
  {
    name: 'renders an interactive surface as a button',
    input: { interactive: true as const, className: 'catalogue-card' },
    expected: { tagName: 'BUTTON', className: 'card card--interactive catalogue-card', buttonCount: 1 },
  },
]

describe('Card', () => {
  it.each(renderingCases)('$name', ({ input, expected }) => {
    const { container } = render(<Card {...input}>Card content</Card>)
    const card = screen.getByText('Card content')

    expect({
      tagName: card.tagName,
      className: card.className,
      buttonCount: container.querySelectorAll('button').length,
    }).toEqual(expected)
  })

  const behaviorCases = [
    {
      name: 'forwards interactive card behavior',
      input: { clickCount: 2 },
      expected: { calls: 2, type: 'button' },
    },
  ]

  it.each(behaviorCases)('$name', ({ input, expected }) => {
    const onClick = vi.fn()
    render(<Card interactive onClick={onClick}>Open game</Card>)
    const card = screen.getByRole('button', { name: 'Open game' })

    for (let click = 0; click < input.clickCount; click += 1) card.click()

    expect({ calls: onClick.mock.calls.length, type: card.getAttribute('type') }).toEqual(expected)
  })
})
