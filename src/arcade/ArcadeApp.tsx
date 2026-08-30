import { useEffect, useRef, useState } from 'react'
import { appConfig } from '../config'
import { AppHeader, AppHeaderAction, AppShell, GameCatalogue, IconButton, PageContainer, PageIntro } from '../shared/ui'
import { GameManager } from './GameManager'
import { gameRegistry } from './GameRegistry'
import type { GameDefinition } from './types'

export function ArcadeApp() {
  const gameHostRef = useRef<HTMLDivElement>(null)
  const managerRef = useRef<GameManager | null>(null)
  const [activeGame, setActiveGame] = useState<GameDefinition | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const manager = new GameManager()
    managerRef.current = manager
    manager.initialize(gameHostRef.current!)
    const unsubscribeFullscreen = manager.onFullscreenChange(setIsFullscreen)
    return () => { unsubscribeFullscreen(); manager.destroy() }
  }, [])

  async function play(definition: GameDefinition) {
    setActiveGame(definition)
    setIsLoading(true)
    try { await managerRef.current?.start(definition) }
    catch { setActiveGame(null) }
    finally { setIsLoading(false) }
  }

  function returnToArcade() {
    if (managerRef.current?.isFullscreen()) managerRef.current.toggleFullscreen()
    managerRef.current?.stop()
    setActiveGame(null)
  }

  return (
    <AppShell header={<AppHeader brand={appConfig.name} onHome={returnToArcade} actions={activeGame && (
      <AppHeaderAction onClick={returnToArcade} icon="×" label="Exit game" collapseOnSmall />
    )} />}>
      <div className="arcade-app">
        {activeGame && <section className="game-page" aria-live="polite">
          <div className="game-heading"><span>{activeGame.icon}</span><h1>{activeGame.title}</h1></div>
          {isLoading && <p>Loading game…</p>}
        </section>}
        <div ref={gameHostRef} className={activeGame ? 'game-host game-host-active' : 'game-host'}>
          {activeGame && <IconButton className="fullscreen-button" onClick={() => managerRef.current?.toggleFullscreen()} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            <span aria-hidden="true">{isFullscreen ? '×' : '⛶'}</span>
          </IconButton>}
        </div>
        {!activeGame && <PageContainer className="catalogue" spacing="hero">
          <PageIntro eyebrow="Choose a game" title="Your pocket arcade" description="Games load only when you select them, so the arcade stays quick and lightweight." />
          <GameCatalogue games={gameRegistry} onSelect={(game) => void play(game)} />
        </PageContainer>}
      </div>
    </AppShell>
  )
}
