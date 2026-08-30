import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IconButton } from './IconButton'

const cases = [
  { name: 'uses its accessible label as the button name', input: { label: 'Open settings', isLoading: false }, expected: { name: 'Open settings', disabled: false, busy: null, content: 'S' } },
  { name: 'keeps its accessible name while loading', input: { label: 'Open settings', isLoading: true }, expected: { name: 'Open settings', disabled: true, busy: 'true', content: '' } },
]

describe('IconButton', () => {
  it.each(cases)('$name', ({ input, expected }) => {
    render(<IconButton aria-label={input.label} isLoading={input.isLoading}>S</IconButton>)
    const button = screen.getByRole('button', { name: expected.name })
    expect({ name: button.getAttribute('aria-label'), disabled: button.hasAttribute('disabled'), busy: button.getAttribute('aria-busy'), content: button.textContent }).toEqual(expected)
  })
})
