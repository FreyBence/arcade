function readPositiveInteger(name: string, fallback: number): number {
  const value = import.meta.env[name]
  if (value === undefined || value === '') return fallback

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`)
  }

  return parsed
}

export const appConfig = {
  name: import.meta.env.VITE_APP_NAME || 'Mobile Arcade',
  phaser: {
    width: readPositiveInteger('VITE_PHASER_WIDTH', 960),
    height: readPositiveInteger('VITE_PHASER_HEIGHT', 540),
    backgroundColor: import.meta.env.VITE_PHASER_BACKGROUND_COLOR || '#101522',
    activePointers: readPositiveInteger('VITE_PHASER_ACTIVE_POINTERS', 3),
  },
} as const
