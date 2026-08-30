import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from '../Checkbox'
import { FieldMessage } from '../FieldMessage'
import { Input } from '../Input'
import { Label } from '../Label'
import { PasswordInput } from '../PasswordInput'
import { FormField } from './FormField'

const associationCases = [
  {
    name: 'associates a generated label, input, and hint',
    input: { fieldId: undefined, invalid: false, variant: 'hint' as const },
    expected: { invalid: null, messageRole: null, disabled: false },
  },
  {
    name: 'associates an explicit field id with an accessible error',
    input: { fieldId: 'email', invalid: true, variant: 'error' as const },
    expected: { invalid: 'true', messageRole: 'alert', disabled: false },
  },
  {
    name: 'passes the disabled field state to its control',
    input: { fieldId: 'email', invalid: false, variant: 'hint' as const, disabled: true },
    expected: { invalid: null, messageRole: null, disabled: true },
  },
]

describe('FormField controls', () => {
  it.each(associationCases)('$name', ({ input, expected }) => {
    render(
      <FormField id={input.fieldId} invalid={input.invalid} disabled={input.disabled}>
        <Label>Email address</Label>
        <Input />
        <FieldMessage variant={input.variant}>Enter a valid email address.</FieldMessage>
      </FormField>,
    )

    const control = screen.getByLabelText('Email address')
    const message = screen.getByText('Enter a valid email address.')
    expect({
      invalid: control.getAttribute('aria-invalid'),
      messageRole: message.getAttribute('role'),
      disabled: control.hasAttribute('disabled'),
      describedByMatches: control.getAttribute('aria-describedby') === message.id,
    }).toEqual({ ...expected, describedByMatches: true })
  })

  const inputCases = [
    {
      name: 'renders a text input by default',
      input: { component: 'input' as const },
      expected: { type: 'text', value: 'player' },
    },
    {
      name: 'renders a password input without exposing its value',
      input: { component: 'password' as const },
      expected: { type: 'password', value: 'player' },
    },
  ]

  it.each(inputCases)('$name', ({ input, expected }) => {
    render(
      <FormField id="credential">
        <Label>Credential</Label>
        {input.component === 'password' ? <PasswordInput defaultValue="player" /> : <Input defaultValue="player" />}
      </FormField>,
    )
    const control = screen.getByLabelText<HTMLInputElement>('Credential')
    expect({ type: control.type, value: control.value }).toEqual(expected)
  })

  const checkboxCases = [
    {
      name: 'toggles from the label with native checkbox behavior',
      input: { clicks: 1, disabled: false },
      expected: { checked: true, calls: 1 },
    },
    {
      name: 'does not toggle when disabled',
      input: { clicks: 1, disabled: true },
      expected: { checked: false, calls: 0 },
    },
  ]

  it.each(checkboxCases)('$name', async ({ input, expected }) => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Checkbox disabled={input.disabled} onChange={onChange}>
        Remember me
      </Checkbox>,
    )

    const control = screen.getByRole('checkbox', { name: 'Remember me' })
    for (let click = 0; click < input.clicks; click += 1) await user.click(screen.getByText('Remember me'))
    expect({ checked: (control as HTMLInputElement).checked, calls: onChange.mock.calls.length }).toEqual(expected)
  })
})
