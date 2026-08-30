function readPositiveInteger(name: string, fallback: number): number {
  const value: unknown = import.meta.env[name]
  if (value === undefined || value === '') return fallback

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`)
  }

  return parsed
}

function readString(name: string, fallback: string): string {
  const value: unknown = import.meta.env[name]
  return typeof value === 'string' && value !== '' ? value : fallback
}

export const appConfig = {
  name: readString('VITE_APP_NAME', 'Mobile Arcade'),
  phaser: {
    width: readPositiveInteger('VITE_PHASER_WIDTH', 960),
    height: readPositiveInteger('VITE_PHASER_HEIGHT', 540),
    backgroundColor: readString('VITE_PHASER_BACKGROUND_COLOR', '#101522'),
    activePointers: readPositiveInteger('VITE_PHASER_ACTIVE_POINTERS', 3),
  },
} as const
