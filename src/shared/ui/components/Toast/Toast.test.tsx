import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from './Toast'
import { useToast, type ToastVariant } from './useToast'

function ToastTrigger({ variant, duration }: { variant: ToastVariant; duration?: number }) {
  const { showToast } = useToast()
  return <button onClick={() => showToast({ message: `${variant} message`, variant, duration })}>Notify</button>
}

const announcementCases = [
  { name: 'announces success politely', input: { variant: 'success' as const }, expected: { role: 'status', text: 'success message' } },
  { name: 'announces information politely', input: { variant: 'info' as const }, expected: { role: 'status', text: 'info message' } },
  { name: 'announces errors assertively', input: { variant: 'error' as const }, expected: { role: 'alert', text: 'error message' } },
]

describe('ToastProvider', () => {
  it.each(announcementCases)('$name', async ({ input, expected }) => {
    render(<ToastProvider><ToastTrigger variant={input.variant} duration={0} /></ToastProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'Notify' }))
    expect(screen.getByRole(expected.role)).toHaveTextContent(expected.text)
  })

  const lifecycleCases = [
    { name: 'can be dismissed immediately', input: { method: 'button' as const }, expected: { visible: false } },
    { name: 'dismisses after its duration', input: { method: 'timer' as const }, expected: { visible: false } },
  ]

  it.each(lifecycleCases)('$name', async ({ input, expected }) => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    render(<ToastProvider><ToastTrigger variant="info" duration={input.method === 'timer' ? 100 : 0} /></ToastProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'Notify' }))
    if (input.method === 'button') await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    else act(() => { vi.advanceTimersByTime(100) })
    expect(screen.queryByText('info message') !== null).toBe(expected.visible)
    vi.useRealTimers()
  })
})
