import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadConfig() {
  vi.resetModules()
  return (await import('./config')).appConfig
}

type ConfigCase = {
  name: string
  input: { environment: Record<string, string> }
  expected: { value?: unknown; error?: string }
}

const configCases: ConfigCase[] = [
  {
    name: 'uses browser-friendly defaults when environment values are absent',
    input: {
      environment: {
        VITE_APP_NAME: '',
        VITE_PHASER_WIDTH: '',
        VITE_PHASER_HEIGHT: '',
        VITE_PHASER_BACKGROUND_COLOR: '',
        VITE_PHASER_ACTIVE_POINTERS: '',
      },
    },
    expected: {
      value: {
        name: 'Mobile Arcade',
        phaser: { width: 960, height: 540, backgroundColor: '#101522', activePointers: 3 },
      },
    },
  },
  {
    name: 'reads valid Vite environment overrides',
    input: {
      environment: {
        VITE_APP_NAME: 'Pocket Games',
        VITE_PHASER_WIDTH: '800',
        VITE_PHASER_HEIGHT: '600',
        VITE_PHASER_BACKGROUND_COLOR: '#000000',
        VITE_PHASER_ACTIVE_POINTERS: '5',
      },
    },
    expected: {
      value: {
        name: 'Pocket Games',
        phaser: { width: 800, height: 600, backgroundColor: '#000000', activePointers: 5 },
      },
    },
  },
  {
    name: 'rejects a zero integer value',
    input: { environment: { VITE_PHASER_WIDTH: '0' } },
    expected: { error: 'VITE_PHASER_WIDTH must be a positive integer.' },
  },
  {
    name: 'rejects a negative integer value',
    input: { environment: { VITE_PHASER_WIDTH: '-1' } },
    expected: { error: 'VITE_PHASER_WIDTH must be a positive integer.' },
  },
  {
    name: 'rejects a fractional value',
    input: { environment: { VITE_PHASER_WIDTH: '1.5' } },
    expected: { error: 'VITE_PHASER_WIDTH must be a positive integer.' },
  },
  {
    name: 'rejects a non-numeric value',
    input: { environment: { VITE_PHASER_WIDTH: 'not-a-number' } },
    expected: { error: 'VITE_PHASER_WIDTH must be a positive integer.' },
  },
]

afterEach(() => vi.unstubAllEnvs())

describe('appConfig', () => {
  it.each(configCases)('$name', async ({ input, expected }) => {
    for (const [name, value] of Object.entries(input.environment)) vi.stubEnv(name, value)

    if ('error' in expected && typeof expected.error === 'string') {
      await expect(loadConfig()).rejects.toThrow(expected.error)
      return
    }

    await expect(loadConfig()).resolves.toEqual(expected.value)
  })
})
