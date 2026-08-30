import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageIntro } from './PageIntro'

const renderingCases = [
  {
    name: 'renders the complete introduction',
    input: { eyebrow: 'Choose a game', title: 'Your pocket arcade', description: 'Play anywhere.' },
    expected: { eyebrow: true, title: 'Your pocket arcade', description: true },
  },
  {
    name: 'omits optional introduction content',
    input: { eyebrow: undefined, title: 'Settings', description: undefined },
    expected: { eyebrow: false, title: 'Settings', description: false },
  },
]

describe('PageIntro', () => {
  it.each(renderingCases)('$name', ({ input, expected }) => {
    render(<PageIntro {...input} />)

    expect({
      eyebrow: screen.queryByText('Choose a game') !== null,
      title: screen.getByRole('heading', { level: 1 }).textContent,
      description: screen.queryByText('Play anywhere.') !== null,
    }).toEqual(expected)
  })
})
