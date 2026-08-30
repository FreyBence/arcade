import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

const cases = [
  { name: 'uses safe defaults', input: {}, expected: { className: 'button button--primary button--medium', disabled: false, busy: null, text: 'Continue' } },
  { name: 'applies an explicit variant and size', input: { variant: 'danger' as const, size: 'large' as const }, expected: { className: 'button button--danger button--large', disabled: false, busy: null, text: 'Continue' } },
  { name: 'exposes the loading state', input: { isLoading: true, loadingLabel: 'Saving' }, expected: { className: 'button button--primary button--medium', disabled: true, busy: 'true', text: 'Saving' } },
  { name: 'honors the disabled state', input: { disabled: true }, expected: { className: 'button button--primary button--medium', disabled: true, busy: null, text: 'Continue' } },
]

describe('Button', () => {
  it.each(cases)('$name', ({ input, expected }) => {
    render(<Button {...input}>Continue</Button>)
    const button = screen.getByRole('button')
    expect({ className: button.className, disabled: button.hasAttribute('disabled'), busy: button.getAttribute('aria-busy'), text: button.textContent }).toEqual(expected)
  })

  const behaviorCases = [
    { name: 'forwards button behavior', input: { clickCount: 1 }, expected: { calls: 1 } },
  ]

  it.each(behaviorCases)('$name', ({ input, expected }) => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Continue</Button>)
    for (let click = 0; click < input.clickCount; click += 1) screen.getByRole('button').click()
    expect({ calls: onClick.mock.calls.length }).toEqual(expected)
  })
})
