import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageContainer } from './PageContainer'

const renderingCases = [
  {
    name: 'uses standard spacing by default',
    input: { spacing: undefined, className: undefined },
    expected: 'page-container page-container--standard',
  },
  {
    name: 'uses hero spacing and preserves custom classes',
    input: { spacing: 'hero' as const, className: 'catalogue' },
    expected: 'page-container page-container--hero catalogue',
  },
]

describe('PageContainer', () => {
  it.each(renderingCases)('$name', ({ input, expected }) => {
    render(<PageContainer {...input} data-testid="container">Content</PageContainer>)

    expect(screen.getByTestId('container').className).toBe(expected)
  })
})
