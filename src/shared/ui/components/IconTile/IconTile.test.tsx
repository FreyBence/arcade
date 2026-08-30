import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IconTile } from './IconTile'

const cases = [
  {
    name: 'renders the default accent tile',
    input: { className: undefined, label: 'Game icon' },
    expected: { tagName: 'SPAN', className: 'icon-tile', label: 'Game icon' },
  },
  {
    name: 'forwards span attributes and a custom class',
    input: { className: 'game-icon', label: 'Puzzle icon' },
    expected: { tagName: 'SPAN', className: 'icon-tile game-icon', label: 'Puzzle icon' },
  },
]

describe('IconTile', () => {
  it.each(cases)('$name', ({ input, expected }) => {
    render(<IconTile className={input.className} aria-label={input.label}>★</IconTile>)
    const tile = screen.getByLabelText(input.label)

    expect({
      tagName: tile.tagName,
      className: tile.className,
      label: tile.getAttribute('aria-label'),
    }).toEqual(expected)
  })
})
