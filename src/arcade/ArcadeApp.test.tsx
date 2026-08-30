import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deferred } from '../test/testUtils'

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  destroy: vi.fn(),
}))

vi.mock('./GameManager', () => ({
  GameManager: class {
    initialize = mocks.initialize
    start = mocks.start
    stop = mocks.stop
    destroy = mocks.destroy
  },
}))

vi.mock('./GameRegistry', () => ({
  gameRegistry: [{
    id: 'test-game',
    title: 'Test Game',
    description: 'Core lifecycle fixture',
    icon: 'T',
    load: vi.fn(),
  }],
}))

import { ArcadeApp } from './ArcadeApp'

const appCases = [
  {
    name: 'initializes the runtime and shows the catalogue',
    input: { action: 'render' as const },
    expected: { catalogueVisible: true, gameVisible: false, loadingVisible: false, stops: 0, destroys: 0 },
  },
  {
    name: 'shows loading while starting and then displays the game',
    input: { action: 'start' as const },
    expected: { catalogueVisible: false, gameVisible: true, loadingVisible: true, stops: 0, destroys: 0 },
  },
  {
    name: 'exits an active game to the catalogue',
    input: { action: 'exit' as const },
    expected: { catalogueVisible: true, gameVisible: false, loadingVisible: false, stops: 1, destroys: 0 },
  },
  {
    name: 'returns home when the brand is selected',
    input: { action: 'brand' as const },
    expected: { catalogueVisible: true, gameVisible: false, loadingVisible: false, stops: 1, destroys: 0 },
  },
  {
    name: 'returns to the catalogue when a game cannot start',
    input: { action: 'start-error' as const },
    expected: { catalogueVisible: true, gameVisible: false, loadingVisible: false, stops: 0, destroys: 0 },
  },
  {
    name: 'destroys the runtime when unmounted',
    input: { action: 'unmount' as const },
    expected: { catalogueVisible: false, gameVisible: false, loadingVisible: false, stops: 0, destroys: 1 },
  },
]

describe('ArcadeApp behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.start.mockResolvedValue(undefined)
  })

  it.each(appCases)('$name', async ({ input, expected }) => {
    const user = userEvent.setup()
    const pendingStart = deferred<void>()
    if (input.action === 'start') mocks.start.mockReturnValue(pendingStart.promise)
    if (input.action === 'start-error') mocks.start.mockRejectedValue(new Error('load failed'))

    const rendered = render(<ArcadeApp />)
    let loadingWasVisible = false
    expect(mocks.initialize).toHaveBeenCalledWith(rendered.container.querySelector('.game-host'))

    if (input.action === 'start' || input.action === 'exit' || input.action === 'start-error') {
      await user.click(screen.getByRole('button', { name: /Test Game/ }))
    }
    if (input.action === 'start') {
      loadingWasVisible = screen.queryByText(/Loading game/) !== null
      pendingStart.resolve()
      await screen.findByRole('heading', { name: 'Test Game' })
    }
    if (input.action === 'exit') await user.click(screen.getByRole('button', { name: 'Exit game' }))
    if (input.action === 'brand') {
      await user.click(screen.getByRole('button', { name: 'Return to arcade home' }))
    }
    if (input.action === 'unmount') rendered.unmount()

    expect({
      catalogueVisible: screen.queryByRole('heading', { name: 'Your pocket arcade' }) !== null,
      gameVisible: screen.queryByRole('heading', { name: 'Test Game' }) !== null,
      loadingVisible: loadingWasVisible,
      stops: mocks.stop.mock.calls.length,
      destroys: mocks.destroy.mock.calls.length,
    }).toEqual(expected)
  })
})
