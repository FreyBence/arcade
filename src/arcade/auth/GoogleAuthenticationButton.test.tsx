import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GoogleAuthenticationButton } from './GoogleAuthenticationButton'

const buttonCases = [
  { name: 'starts Google authentication', input: { disabled: false }, expected: { calls: 1, disabled: false } },
  { name: 'cannot start while authentication is disabled', input: { disabled: true }, expected: { calls: 0, disabled: true } },
]

describe('Google authentication button', () => {
  it.each(buttonCases)('$name', async ({ input, expected }) => {
    const startAuthentication = vi.fn()
    render(<GoogleAuthenticationButton disabled={input.disabled} startAuthentication={startAuthentication} />)
    const button = screen.getByRole('button', { name: 'Continue with Google' })
    await userEvent.click(button)
    expect(startAuthentication).toHaveBeenCalledTimes(expected.calls)
    expect(button).toHaveProperty('disabled', expected.disabled)
  })
})
