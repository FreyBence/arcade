import { useEffect, useRef, useState } from 'react'
import { appConfig } from '../config'
import { ClientIdentityProvider, createClientIdentityStore, createLocalGuestIdentityStore } from '../shared/identity'
import { AppHeader, AppHeaderAction, AppShell, FullscreenButton, GameCatalogue, GameErrorState, GameLoadingState, GamePageHeader, GameViewport, PageContainer, PageIntro } from '../shared/ui'
import { GameManager } from './GameManager'
import { gameRegistry } from './GameRegistry'
import { RegistrationPage, createBrowserRegistrationClient } from './auth'
import type { GameDefinition } from './types'

export function ArcadeApp() {
  const [identityStore] = useState(() => createClientIdentityStore({
    session: { restore: () => Promise.resolve(null), logout: () => Promise.resolve() },
    guestStore: createLocalGuestIdentityStore(),
  }))

  return <ClientIdentityProvider store={identityStore}><ArcadeContent /></ClientIdentityProvider>
}

function ArcadeContent() {
  const gameHostRef = useRef<HTMLDivElement>(null)
  const managerRef = useRef<GameManager | null>(null)
  const [activeGame, setActiveGame] = useState<GameDefinition | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)
  const [registrationClient] = useState(createBrowserRegistrationClient)

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
    setShowRegistration(false)
  }

  const headerAction = activeGame
    ? <AppHeaderAction onClick={returnToArcade} icon="×" label="Exit game" collapseOnSmall />
    : showRegistration
      ? <AppHeaderAction onClick={returnToArcade} icon="←" label="Back to arcade" collapseOnSmall />
      : <AppHeaderAction onClick={() => setShowRegistration(true)} icon="+" label="Create account" />

  return (
    <AppShell header={<AppHeader brand={appConfig.name} onHome={returnToArcade} actions={headerAction} />}>
      <PageContainer className="game-page" spacing="standard" hidden={!activeGame}>
        {activeGame && <GamePageHeader icon={activeGame.icon} title={activeGame.title} />}
        <GameViewport ref={gameHostRef} className="game-host" active={Boolean(activeGame)} fullscreen={isFullscreen}>
          {isLoading && <GameLoadingState />}
          {loadError && <GameErrorState />}
          {activeGame && <FullscreenButton fullscreen={isFullscreen} onToggle={() => managerRef.current?.toggleFullscreen()} />}
        </GameViewport>
      </PageContainer>
      {!activeGame && !showRegistration && (
        <PageContainer spacing="hero">
          <PageIntro eyebrow="Choose a game" title="Your pocket arcade" description="Games load only when you select them, so the arcade stays quick and lightweight." />
          <GameCatalogue games={gameRegistry} onSelect={(game) => void play(game)} />
        </PageContainer>
      )}
      {showRegistration && (
        <RegistrationPage client={registrationClient} onCancel={returnToArcade} onSuccess={returnToArcade} />
      )}
    </AppShell>
  )
}
