import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../Button'
import { Dialog } from './Dialog'

const renderCases = [
  {
    name: 'does not render when closed',
    input: { open: false, actions: false },
    expected: { dialog: false, title: false, body: false, action: false },
  },
  {
    name: 'renders semantic content and actions when open',
    input: { open: true, actions: true },
    expected: { dialog: true, title: true, body: true, action: true },
  },
]

describe('Dialog', () => {
  it.each(renderCases)('$name', ({ input, expected }) => {
    render(
      <Dialog
        open={input.open}
        title="Leave the arcade?"
        actions={input.actions ? <Button>Leave</Button> : undefined}
      >
        Your current game will close.
      </Dialog>,
    )

    const dialog = screen.queryByRole('dialog')
    expect({
      dialog: Boolean(dialog),
      title: Boolean(screen.queryByText('Leave the arcade?')),
      body: Boolean(screen.queryByText('Your current game will close.')),
      action: Boolean(screen.queryByRole('button', { name: 'Leave' })),
    }).toEqual(expected)
    if (dialog) {
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAccessibleName('Leave the arcade?')
      expect(dialog).toHaveAccessibleDescription('Your current game will close.')
    }
  })

  const dismissalCases = [
    { name: 'dismisses with Escape when allowed', input: { dismissible: true, key: '{Escape}' }, expected: { calls: 1 } },
    { name: 'keeps explicit-decision dialogs open on Escape', input: { dismissible: false, key: '{Escape}' }, expected: { calls: 0 } },
  ]

  it.each(dismissalCases)('$name', async ({ input, expected }) => {
    const onDismiss = vi.fn()
    render(<Dialog open title="Confirm" dismissible={input.dismissible} onDismiss={onDismiss}>Choose an action.</Dialog>)
    await userEvent.keyboard(input.key)
    expect({ calls: onDismiss.mock.calls.length }).toEqual(expected)
  })

  const focusCases = [
    { name: 'wraps forward focus inside the dialog', input: { start: 'last', keys: '{Tab}' }, expected: { active: 'First' } },
    { name: 'wraps backward focus inside the dialog', input: { start: 'first', keys: '{Shift>}{Tab}{/Shift}' }, expected: { active: 'Last' } },
  ]

  it.each(focusCases)('$name', async ({ input, expected }) => {
    render(
      <Dialog open title="Confirm">
        <Button>First</Button>
        <Button>Last</Button>
      </Dialog>,
    )
    const first = screen.getByRole('button', { name: 'First' })
    const last = screen.getByRole('button', { name: 'Last' })
    ;(input.start === 'first' ? first : last).focus()
    await userEvent.keyboard(input.keys)
    expect({ active: (document.activeElement as HTMLElement).textContent }).toEqual(expected)
  })

  it('moves focus into the dialog, blocks the background, and restores both on close', () => {
    const initialFocusRef = createRef<HTMLButtonElement>()
    const { rerender } = render(
      <>
        <button>Launcher</button>
        <Dialog open={false} title="Confirm" initialFocusRef={initialFocusRef}>
          <button ref={initialFocusRef}>Preferred</button>
        </Dialog>
      </>,
    )
    const launcher = screen.getByRole('button', { name: 'Launcher' })
    launcher.focus()

    rerender(
      <>
        <button>Launcher</button>
        <Dialog open title="Confirm" initialFocusRef={initialFocusRef}>
          <button ref={initialFocusRef}>Preferred</button>
        </Dialog>
      </>,
    )
    expect({ active: document.activeElement?.textContent, overflow: document.body.style.overflow })
      .toEqual({ active: 'Preferred', overflow: 'hidden' })

    rerender(
      <>
        <button>Launcher</button>
        <Dialog open={false} title="Confirm" initialFocusRef={initialFocusRef}>
          <button ref={initialFocusRef}>Preferred</button>
        </Dialog>
      </>,
    )
    expect({ active: document.activeElement?.textContent, overflow: document.body.style.overflow })
      .toEqual({ active: 'Launcher', overflow: '' })
  })
})
