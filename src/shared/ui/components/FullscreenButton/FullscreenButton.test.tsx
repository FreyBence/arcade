import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FullscreenButton } from './FullscreenButton'

const cases = [
  { name: 'offers fullscreen entry', input: { fullscreen: false }, expected: { label: 'Enter fullscreen' } },
  { name: 'offers fullscreen exit', input: { fullscreen: true }, expected: { label: 'Exit fullscreen' } },
]

describe('FullscreenButton', () => {
  it.each(cases)('$name', async ({ input, expected }) => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<FullscreenButton fullscreen={input.fullscreen} onToggle={onToggle} />)
    await user.click(screen.getByRole('button', { name: expected.label }))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
