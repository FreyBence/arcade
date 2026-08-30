import { useEffect, useRef, useState } from 'react'
import { GameManager } from './GameManager'
import { gameRegistry } from './GameRegistry'
import type { GameDefinition } from './types'
import { appConfig } from '../config'

export function ArcadeApp() {
  const gameHostRef = useRef<HTMLDivElement>(null)
  const managerRef = useRef<GameManager | null>(null)
  const [activeGame, setActiveGame] = useState<GameDefinition | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const manager = new GameManager()
    managerRef.current = manager
    manager.initialize(gameHostRef.current!)

    return () => manager.destroy()
  }, [])

  async function play(definition: GameDefinition) {
    setActiveGame(definition)
    setIsLoading(true)
    try {
      await managerRef.current?.start(definition)
    } catch {
      setActiveGame(null)
    } finally {
      setIsLoading(false)
    }
  }

  function returnToArcade() {
    managerRef.current?.stop()
    setActiveGame(null)
  }

  return (
    <main className="arcade-app">
      <header className="app-header">
        <button className="brand" onClick={returnToArcade} aria-label="Return to arcade home">
          {appConfig.name}
        </button>
        {activeGame && <button onClick={returnToArcade}>Exit game</button>}
      </header>

      {activeGame && (
        <section className="game-page" aria-live="polite">
          <div className="game-heading">
            <span>{activeGame.icon}</span>
            <h1>{activeGame.title}</h1>
          </div>
          {isLoading && <p>Loading game…</p>}
        </section>
      )}
      <div ref={gameHostRef} className={activeGame ? 'game-host game-host-active' : 'game-host'} />
      {!activeGame && (
        <section className="catalogue">
          <p className="eyebrow">Choose a game</p>
          <h1>Your pocket arcade</h1>
          <p className="intro">Games load only when you select them, so the arcade stays quick and lightweight.</p>
          <div className="game-grid">
            {gameRegistry.map((game) => (
              <button className="game-card" key={game.id} onClick={() => void play(game)}>
                <span className="game-icon">{game.icon}</span>
                <span className="game-card-copy"><strong>{game.title}</strong><small>{game.description}</small></span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
