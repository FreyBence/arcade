import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShell } from './AppShell'

const renderingCases = [
  {
    name: 'renders application regions and forwards root attributes',
    input: { header: 'Header', overlays: 'Dialog', className: 'signed-in' },
    expected: { className: 'app-shell signed-in', header: true, content: true, overlay: true },
  },
  {
    name: 'supports a shell without optional regions',
    input: { header: undefined, overlays: undefined, className: undefined },
    expected: { className: 'app-shell', header: false, content: true, overlay: false },
  },
]

describe('AppShell', () => {
  it.each(renderingCases)('$name', ({ input, expected }) => {
    const { container } = render(
      <AppShell className={input.className} header={input.header} overlays={input.overlays} data-testid="shell">
        Page content
      </AppShell>,
    )

    expect({
      className: screen.getByTestId('shell').className,
      header: screen.queryByText('Header') !== null,
      content: screen.getByRole('main').textContent === 'Page content',
      overlay: container.querySelector('#app-overlay-root')?.textContent === 'Dialog',
    }).toEqual(expected)
  })
})
