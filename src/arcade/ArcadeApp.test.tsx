import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deferred } from '../test/testUtils'

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  destroy: vi.fn(),
  toggleFullscreen: vi.fn(),
  isFullscreen: vi.fn(),
  onFullscreenChange: vi.fn(),
  unsubscribeFullscreen: vi.fn(),
  fullscreenListener: undefined as ((isFullscreen: boolean) => void) | undefined,
}))

vi.mock('./GameManager', () => ({
  GameManager: class {
    initialize = mocks.initialize
    start = mocks.start
    stop = mocks.stop
    destroy = mocks.destroy
    toggleFullscreen = mocks.toggleFullscreen
    isFullscreen = mocks.isFullscreen
    onFullscreenChange = mocks.onFullscreenChange
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
    name: 'shows the shared error state when a game cannot start',
    input: { action: 'start-error' as const },
    expected: { catalogueVisible: false, gameVisible: true, loadingVisible: false, stops: 0, destroys: 0, errorVisible: true },
  },
  {
    name: 'destroys the runtime when unmounted',
    input: { action: 'unmount' as const },
    expected: { catalogueVisible: false, gameVisible: false, loadingVisible: false, stops: 0, destroys: 1 },
  },
  {
    name: 'expands an active game to fullscreen',
    input: { action: 'fullscreen' as const },
    expected: { catalogueVisible: false, gameVisible: true, loadingVisible: false, stops: 0, destroys: 0, fullscreenToggles: 1, exitFullscreenVisible: true },
  },
  {
    name: 'opens registration from the main header',
    input: { action: 'register' as const },
    expected: { catalogueVisible: false, gameVisible: false, loadingVisible: false, stops: 0, destroys: 0, registrationVisible: true },
  },
  {
    name: 'opens login from the main header',
    input: { action: 'login' as const },
    expected: { catalogueVisible: false, gameVisible: false, loadingVisible: false, stops: 0, destroys: 0, loginVisible: true },
  },
]

describe('ArcadeApp behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.start.mockResolvedValue(undefined)
    mocks.isFullscreen.mockReturnValue(false)
    mocks.onFullscreenChange.mockImplementation((listener: (isFullscreen: boolean) => void) => {
      mocks.fullscreenListener = listener
      listener(false)
      return mocks.unsubscribeFullscreen
    })
    mocks.toggleFullscreen.mockImplementation(() => mocks.fullscreenListener?.(true))
  })

  it.each(appCases)('$name', async ({ input, expected }) => {
    const user = userEvent.setup()
    const pendingStart = deferred<void>()
    if (input.action === 'start') mocks.start.mockReturnValue(pendingStart.promise)
    if (input.action === 'start-error') mocks.start.mockRejectedValue(new Error('load failed'))

    const rendered = render(<ArcadeApp />)
    let loadingWasVisible = false
    expect(rendered.container.querySelector('.app-shell')).toContainElement(rendered.container.querySelector('.app-header'))
    expect(rendered.container.querySelector('.app-shell__main')).toContainElement(rendered.container.querySelector('.page-container'))
    expect(mocks.initialize).toHaveBeenCalledWith(rendered.container.querySelector('.game-host'))

    if (input.action === 'start' || input.action === 'exit' || input.action === 'start-error' || input.action === 'fullscreen') {
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
    if (input.action === 'fullscreen') {
      await user.click(screen.getByRole('button', { name: 'Enter fullscreen' }))
    }
    if (input.action === 'register') {
      await user.click(screen.getByRole('button', { name: 'Create account' }))
    }
    if (input.action === 'login') {
      await user.click(screen.getByRole('button', { name: 'Sign in' }))
    }

    expect({
      catalogueVisible: screen.queryByRole('heading', { name: 'Your pocket arcade' }) !== null,
      gameVisible: screen.queryByRole('heading', { name: 'Test Game' }) !== null,
      loadingVisible: loadingWasVisible,
      stops: mocks.stop.mock.calls.length,
      destroys: mocks.destroy.mock.calls.length,
      ...('fullscreenToggles' in expected ? { fullscreenToggles: mocks.toggleFullscreen.mock.calls.length } : {}),
      ...('exitFullscreenVisible' in expected ? { exitFullscreenVisible: screen.queryByRole('button', { name: 'Exit fullscreen' }) !== null } : {}),
      ...('errorVisible' in expected ? { errorVisible: screen.queryByRole('alert') !== null } : {}),
      ...('registrationVisible' in expected ? { registrationVisible: screen.queryByRole('heading', { name: 'Join the arcade' }) !== null } : {}),
      ...('loginVisible' in expected ? { loginVisible: screen.queryByRole('heading', { name: 'Sign in to the arcade' }) !== null } : {}),
    }).toEqual(expected)
  })
})
