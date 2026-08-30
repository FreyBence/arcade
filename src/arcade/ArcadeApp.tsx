import { useEffect, useRef, useState } from 'react'
import { appConfig } from '../config'
import { AppHeader, AppHeaderAction, AppShell, FullscreenButton, GameCatalogue, GameErrorState, GameLoadingState, GamePageHeader, GameViewport, PageContainer, PageIntro } from '../shared/ui'
import { GameManager } from './GameManager'
import { gameRegistry } from './GameRegistry'
import type { GameDefinition } from './types'

export function ArcadeApp() {
  const gameHostRef = useRef<HTMLDivElement>(null)
  const managerRef = useRef<GameManager | null>(null)
  const [activeGame, setActiveGame] = useState<GameDefinition | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
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
    setLoadError(false)
    try { await managerRef.current?.start(definition) }
    catch { setLoadError(true) }
    finally { setIsLoading(false) }
  }

  function returnToArcade() {
    if (managerRef.current?.isFullscreen()) managerRef.current.toggleFullscreen()
    managerRef.current?.stop()
    setActiveGame(null)
    setLoadError(false)
  }

  return (
    <AppShell header={<AppHeader brand={appConfig.name} onHome={returnToArcade} actions={activeGame && (
      <AppHeaderAction onClick={returnToArcade} icon="×" label="Exit game" collapseOnSmall />
    )} />}>
      <div className="arcade-app">
        <PageContainer className="game-page" spacing="standard" hidden={!activeGame}>
          {activeGame && <GamePageHeader icon={activeGame.icon} title={activeGame.title} />}
          <GameViewport ref={gameHostRef} className="game-host" active={Boolean(activeGame)} fullscreen={isFullscreen}>
            {isLoading && <GameLoadingState />}
            {loadError && <GameErrorState />}
            {activeGame && <FullscreenButton fullscreen={isFullscreen} onToggle={() => managerRef.current?.toggleFullscreen()} />}
          </GameViewport>
        </PageContainer>
        {!activeGame && <PageContainer className="catalogue" spacing="hero">
          <PageIntro eyebrow="Choose a game" title="Your pocket arcade" description="Games load only when you select them, so the arcade stays quick and lightweight." />
          <GameCatalogue games={gameRegistry} onSelect={(game) => void play(game)} />
        </PageContainer>}
      </div>
    </AppShell>
  )
}
