import Phaser from 'phaser'
import { appConfig } from '../config'
import type { GameDefinition } from './types'

export class GameManager {
  private game: Phaser.Game | undefined
  private activeSceneKey: string | undefined

  initialize(parent: HTMLElement) {
    if (this.game) return

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: appConfig.phaser.width,
      height: appConfig.phaser.height,
      backgroundColor: appConfig.phaser.backgroundColor,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: { activePointers: appConfig.phaser.activePointers },
    })
  }

  async start(definition: GameDefinition) {
    if (!this.game) throw new Error('GameManager must be initialized before starting a game.')
    await this.stop()

    const module = await definition.load()
    const scene = module.createScene()
    this.activeSceneKey = scene.sys.settings.key
    this.game.scene.add(this.activeSceneKey, scene, true)
  }

  async stop() {
    if (!this.game || !this.activeSceneKey) return

    const scene = this.game.scene.getScene(this.activeSceneKey)
    scene.scene.stop()
    this.game.scene.remove(this.activeSceneKey)
    this.activeSceneKey = undefined
  }

  destroy() {
    void this.stop()
    this.game?.destroy(true)
    this.game = undefined
  }
}
