import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../Button'
import { IconButton } from '../IconButton'
import { AppHeader, AppHeaderAction } from './AppHeader'

const renderingCases = [
  {
    name: 'renders the default brand without an empty actions region',
    input: { brand: undefined, actions: undefined, className: undefined },
    expected: { brand: 'Mobile Arcade', className: 'app-header', actions: false },
  },
  {
    name: 'renders custom branding and contextual shared controls',
    input: {
      brand: 'Pocket Games',
      actions: (
        <>
          <Button variant="ghost">Sign in</Button>
          <IconButton aria-label="Open settings">S</IconButton>
        </>
      ),
      className: 'game-active',
    },
    expected: { brand: 'Pocket Games', className: 'app-header game-active', actions: true },
  },
]

describe('AppHeader', () => {
  it.each(renderingCases)('$name', ({ input, expected }) => {
    render(
      <AppHeader
        brand={input.brand}
        actions={input.actions}
        className={input.className}
        onHome={vi.fn()}
        data-testid="header"
      />,
    )

    expect({
      brand: screen.getByRole('button', { name: 'Return to arcade home' }).textContent,
      className: screen.getByTestId('header').className,
      actions: screen.queryByRole('navigation', { name: 'Application actions' }) !== null,
    }).toEqual(expected)
  })

  const behaviorCases = [
    {
      name: 'uses the configured accessible home label and invokes the home action',
      input: { homeLabel: 'Go to game catalogue', clickCount: 1 },
      expected: { calls: 1 },
    },
  ]

  it.each(behaviorCases)('$name', async ({ input, expected }) => {
    const user = userEvent.setup()
    const onHome = vi.fn()
    render(<AppHeader homeLabel={input.homeLabel} onHome={onHome} />)

    const home = screen.getByRole('button', { name: input.homeLabel })
    for (let click = 0; click < input.clickCount; click += 1) await user.click(home)

    expect({ calls: onHome.mock.calls.length }).toEqual(expected)
  })

  const actionCases = [
    {
      name: 'provides an accessible action that can collapse on small screens',
      input: { label: 'Exit game', icon: '×', collapseOnSmall: true },
      expected: { name: 'Exit game', className: 'button button--ghost button--medium app-header__collapsible-action' },
    },
    {
      name: 'keeps ordinary actions at their natural width',
      input: { label: 'Sign in', icon: '→', collapseOnSmall: false },
      expected: { name: 'Sign in', className: 'button button--ghost button--medium' },
    },
  ]

  it.each(actionCases)('$name', ({ input, expected }) => {
    render(<AppHeaderAction {...input} />)
    const action = screen.getByRole('button', { name: input.label })

    expect({ name: action.getAttribute('aria-label'), className: action.className }).toEqual(expected)
  })
})
