import Phaser from 'phaser'
import { appConfig } from '../config'
import type { GameDefinition } from './types'

export class GameManager {
  private game: Phaser.Game | undefined
  private activeSceneKey: string | undefined
  private startGeneration = 0
  private resizeObserver: ResizeObserver | undefined
  private readonly fullscreenListeners = new Set<(isFullscreen: boolean) => void>()
  private readonly refreshViewport = () => this.game?.scale.refresh()
  private readonly reportFullscreenChange = () => {
    const isFullscreen = this.isFullscreen()
    this.fullscreenListeners.forEach((listener) => listener(isFullscreen))
    this.refreshViewport()
  }

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
        fullscreenTarget: parent,
      },
      input: { activePointers: appConfig.phaser.activePointers },
    })

    this.game.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, this.reportFullscreenChange)
    this.game.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.reportFullscreenChange)
    window.addEventListener('resize', this.refreshViewport)
    window.addEventListener('orientationchange', this.refreshViewport)

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.refreshViewport)
      this.resizeObserver.observe(parent)
    }
  }

  async start(definition: GameDefinition) {
    if (!this.game) throw new Error('GameManager must be initialized before starting a game.')
    const generation = ++this.startGeneration
    this.stopActiveScene()

    const module = await definition.load()
    if (generation !== this.startGeneration) return

    const scene = module.createScene()
    this.activeSceneKey = scene.sys.settings.key
    this.game.scene.add(this.activeSceneKey, scene, true)
  }

  stop() {
    this.startGeneration += 1
    this.stopActiveScene()
  }

  toggleFullscreen() {
    if (!this.game) throw new Error('GameManager must be initialized before toggling fullscreen.')

    if (this.game.scale.isFullscreen) {
      this.game.scale.stopFullscreen()
    } else {
      this.game.scale.startFullscreen()
    }
  }

  isFullscreen() {
    return this.game?.scale.isFullscreen ?? false
  }

  onFullscreenChange(listener: (isFullscreen: boolean) => void) {
    this.fullscreenListeners.add(listener)
    listener(this.isFullscreen())
    return () => this.fullscreenListeners.delete(listener)
  }

  private stopActiveScene() {
    if (!this.game || !this.activeSceneKey) return

    const scene = this.game.scene.getScene(this.activeSceneKey)
    scene.scene.stop()
    this.game.scene.remove(this.activeSceneKey)
    this.activeSceneKey = undefined
  }

  destroy() {
    this.startGeneration += 1
    this.stopActiveScene()
    this.resizeObserver?.disconnect()
    this.resizeObserver = undefined
    window.removeEventListener('resize', this.refreshViewport)
    window.removeEventListener('orientationchange', this.refreshViewport)
    this.game?.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, this.reportFullscreenChange)
    this.game?.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.reportFullscreenChange)
    this.game?.destroy(true)
    this.game = undefined
    this.fullscreenListeners.clear()
  }
}
