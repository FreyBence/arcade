import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '../Button'
import { EmptyState, ErrorState, LoadingState, SuccessState } from './FeedbackState'

const cases = [
  { name: 'announces loading politely', input: { kind: 'loading' as const }, expected: { role: 'status', busy: 'true', title: 'Loading games' } },
  { name: 'presents empty content with an action', input: { kind: 'empty' as const }, expected: { role: 'status', busy: null, title: 'No games found' } },
  { name: 'announces errors assertively', input: { kind: 'error' as const }, expected: { role: 'alert', busy: null, title: 'Could not load games' } },
  { name: 'announces successful feedback', input: { kind: 'success' as const }, expected: { role: 'status', busy: null, title: 'Progress saved' } },
]

describe('feedback states', () => {
  it.each(cases)('$name', ({ input, expected }) => {
    const common = { title: expected.title, message: 'Context-specific message', action: <Button>Try again</Button> }
    const view = input.kind === 'loading' ? <LoadingState {...common} /> : input.kind === 'empty' ? <EmptyState {...common} /> : input.kind === 'error' ? <ErrorState {...common} /> : <SuccessState {...common} />
    render(view)
    const state = screen.getByRole(expected.role)
    if (expected.busy) expect(state).toHaveAttribute('aria-busy', expected.busy)
    else expect(state).not.toHaveAttribute('aria-busy')
    expect(screen.getByRole('heading', { name: expected.title })).toBeInTheDocument()
    expect(screen.getByText('Context-specific message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
