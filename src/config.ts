import { APP_CONFIG_DEFAULTS } from './shared/constants'
import { readPositiveInteger, readString } from './shared/utils'

export const appConfig = {
  name: readString(import.meta.env, 'VITE_APP_NAME', APP_CONFIG_DEFAULTS.name),
  phaser: {
    width: readPositiveInteger(import.meta.env, 'VITE_PHASER_WIDTH', APP_CONFIG_DEFAULTS.phaser.width),
    height: readPositiveInteger(import.meta.env, 'VITE_PHASER_HEIGHT', APP_CONFIG_DEFAULTS.phaser.height),
    backgroundColor: readString(import.meta.env, 'VITE_PHASER_BACKGROUND_COLOR', APP_CONFIG_DEFAULTS.phaser.backgroundColor),
    activePointers: readPositiveInteger(import.meta.env, 'VITE_PHASER_ACTIVE_POINTERS', APP_CONFIG_DEFAULTS.phaser.activePointers),
  },
} as const
