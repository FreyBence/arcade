import { beforeEach, describe, expect, it, vi } from 'vitest'
import type Phaser from 'phaser'
import type { GameDefinition } from './types'

const phaser = vi.hoisted(() => {
  const sceneManager = { add: vi.fn(), getScene: vi.fn(), remove: vi.fn() }
  const destroy = vi.fn()
  const Game = vi.fn(function () {
    return { scene: sceneManager, destroy }
  })
  return { Game, sceneManager, destroy }
})

vi.mock('phaser', () => ({
  default: {
    AUTO: 'AUTO',
    Scale: { FIT: 'FIT', CENTER_BOTH: 'CENTER_BOTH' },
    Game: phaser.Game,
  },
}))

import { GameManager } from './GameManager'

function definition(key: string): GameDefinition {
  const scene = { sys: { settings: { key } } } as Phaser.Scene
  return {
    id: key,
    title: key,
    description: '',
    icon: '',
    load: vi.fn().mockResolvedValue({ createScene: () => scene }),
  }
}

const managerCases = [
  {
    name: 'creates only one long-lived runtime',
    input: { operation: 'initialize' as const, initializeCount: 2 },
    expected: { gameCreations: 1, activeSceneAdds: 0, sceneStops: 0, sceneRemovals: 0, destroys: 0 },
  },
  {
    name: 'starts a scene after initialization',
    input: { operation: 'start' as const, sceneKeys: ['first'] },
    expected: { gameCreations: 1, activeSceneAdds: 1, sceneStops: 0, sceneRemovals: 0, destroys: 0 },
  },
  {
    name: 'stops the previous scene when switching',
    input: { operation: 'start' as const, sceneKeys: ['first', 'second'] },
    expected: { gameCreations: 1, activeSceneAdds: 2, sceneStops: 1, sceneRemovals: 1, destroys: 0 },
  },
  {
    name: 'safely ignores repeated stops',
    input: { operation: 'stop' as const, sceneKeys: ['active'], operationCount: 2 },
    expected: { gameCreations: 1, activeSceneAdds: 1, sceneStops: 1, sceneRemovals: 1, destroys: 0 },
  },
  {
    name: 'destroys the runtime only once during repeated teardown',
    input: { operation: 'destroy' as const, sceneKeys: ['active'], operationCount: 2 },
    expected: { gameCreations: 1, activeSceneAdds: 1, sceneStops: 1, sceneRemovals: 1, destroys: 1 },
  },
]

const startErrorCases = [
  {
    name: 'requires initialization before starting a game',
    input: { initialized: false, sceneKey: 'game' },
    expected: { error: 'GameManager must be initialized before starting a game.' },
  },
]

describe('GameManager lifecycle', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(managerCases)('$name', async ({ input, expected }) => {
    const stop = vi.fn()
    phaser.sceneManager.getScene.mockReturnValue({ scene: { stop } })
    const manager = new GameManager()
    const host = document.createElement('div')

    if (input.operation === 'initialize') {
      for (let index = 0; index < input.initializeCount; index += 1) manager.initialize(host)
    } else {
      manager.initialize(host)
      for (const key of input.sceneKeys) await manager.start(definition(key))
      if (input.operation === 'stop') {
        for (let index = 0; index < input.operationCount; index += 1) manager.stop()
      }
      if (input.operation === 'destroy') {
        for (let index = 0; index < input.operationCount; index += 1) manager.destroy()
      }
    }

    expect({
      gameCreations: phaser.Game.mock.calls.length,
      activeSceneAdds: phaser.sceneManager.add.mock.calls.length,
      sceneStops: stop.mock.calls.length,
      sceneRemovals: phaser.sceneManager.remove.mock.calls.length,
      destroys: phaser.destroy.mock.calls.length,
    }).toEqual(expected)

    if (input.operation === 'initialize') {
      expect(phaser.Game).toHaveBeenCalledWith(expect.objectContaining({
        parent: host,
        width: 960,
        height: 540,
        input: { activePointers: 3 },
        scale: { mode: 'FIT', autoCenter: 'CENTER_BOTH' },
      }))
    }
  })

  it.each(startErrorCases)('$name', async ({ input, expected }) => {
    const manager = new GameManager()
    if (input.initialized) manager.initialize(document.createElement('div'))
    await expect(manager.start(definition(input.sceneKey))).rejects.toThrow(expected.error)
  })
})
