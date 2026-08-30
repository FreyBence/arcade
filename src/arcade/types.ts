import type Phaser from 'phaser'

export type GameModule = {
  createScene: () => Phaser.Scene
}

export type GameDefinition = {
  id: string
  title: string
  description: string
  icon: string
  load: () => Promise<GameModule>
}
