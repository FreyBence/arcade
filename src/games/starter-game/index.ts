import Phaser from 'phaser'

export function createScene() {
  return new StarterGameScene()
}

class StarterGameScene extends Phaser.Scene {
  constructor() {
    super('starter-game')
  }

  create() {
    this.add.text(480, 205, 'Starter Game', { fontFamily: 'system-ui', fontSize: '48px', color: '#f8fafc' }).setOrigin(0.5)
    const message = this.add.text(480, 285, 'Tap anywhere', { fontFamily: 'system-ui', fontSize: '24px', color: '#a5b4fc' }).setOrigin(0.5)

    this.input.on('pointerdown', () => {
      message.setText('Nice! Pointer input works on touch and mouse.')
      this.tweens.add({ targets: message, scale: 1.08, yoyo: true, duration: 160 })
    })
  }
}
