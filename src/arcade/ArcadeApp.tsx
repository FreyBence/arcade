import { useEffect, useRef, useState } from 'react'
import { appConfig } from '../config'
import { ClientIdentityProvider, createBrowserClientIdentitySession, createClientIdentityStore, createLocalGuestIdentityStore, useClientIdentity } from '../shared/identity'
import { AppHeader, AppHeaderAction, AppShell, FullscreenButton, GameCatalogue, GameErrorState, GameLoadingState, GamePageHeader, GameViewport, PageContainer, PageIntro, ToastProvider, useToast } from '../shared/ui'
import { GameManager } from './GameManager'
import { gameRegistry } from './GameRegistry'
import { LoginPage, RegistrationPage, createBrowserLoginClient, createBrowserRegistrationClient } from './auth'
import type { GameDefinition } from './types'
import { AccountPage, createBrowserPasswordClient, createBrowserProfileClient } from './account'
import defaultProfilePicture from '../assets/default-profile-dinosaur.png'
import { AdminUsersPage, createBrowserAdminUsersClient } from './admin'

export function ArcadeApp() {
  const [identityStore] = useState(() => createClientIdentityStore({
    session: createBrowserClientIdentitySession(),
    guestStore: createLocalGuestIdentityStore(),
  }))

  return <ClientIdentityProvider store={identityStore}><ToastProvider><ArcadeContent /></ToastProvider></ClientIdentityProvider>
}

function ArcadeContent() {
  const identity = useClientIdentity()
  const { showToast } = useToast()
  const gameHostRef = useRef<HTMLDivElement>(null)
  const managerRef = useRef<GameManager | null>(null)
  const [activeGame, setActiveGame] = useState<GameDefinition | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [showAdminUsers, setShowAdminUsers] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [registrationClient] = useState(createBrowserRegistrationClient)
  const [loginClient] = useState(createBrowserLoginClient)
  const [profileClient] = useState(createBrowserProfileClient)
  const [passwordClient] = useState(createBrowserPasswordClient)
  const [adminUsersClient] = useState(createBrowserAdminUsersClient)

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
    setShowLogin(false)
    setShowAccount(false)
    setShowAdminUsers(false)
  }

  async function logout() {
    setIsLoggingOut(true)
    try {
      await identity.logout()
      returnToArcade()
    } catch {
      showToast({ message: 'Sign out failed. Please try again.', variant: 'error' })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const headerAction = activeGame
    ? <AppHeaderAction onClick={returnToArcade} icon="×" label="Exit game" collapseOnSmall />
    : identity.state.status === 'authenticated'
      ? <>
          {identity.state.user.role === 'ADMIN' && <AppHeaderAction onClick={() => { setShowAccount(false); setShowAdminUsers(true) }} icon="⚙" label="Admin users" />}
          <AppHeaderAction className="app-header__profile-action" onClick={() => { setShowAdminUsers(false); setShowAccount(true) }} icon={<img className="app-header__profile-image" src={identity.state.user.profileImage ?? defaultProfilePicture} alt="" />} label={identity.state.user.name} />
          <AppHeaderAction onClick={() => void logout()} icon="←" label="Sign out" isLoading={isLoggingOut} loadingLabel="Signing out" />
        </>
      : showRegistration || showLogin
      ? <AppHeaderAction onClick={returnToArcade} icon="←" label="Back to arcade" collapseOnSmall />
      : <>
          <AppHeaderAction onClick={() => setShowLogin(true)} icon="→" label="Sign in" />
          <AppHeaderAction onClick={() => setShowRegistration(true)} icon="+" label="Create account" />
        </>

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
      {!activeGame && !showRegistration && !showLogin && !showAccount && !showAdminUsers && (
        <PageContainer spacing="hero">
          <PageIntro eyebrow="Choose a game" title="Your pocket arcade" description="Games load only when you select them, so the arcade stays quick and lightweight." />
          <GameCatalogue games={gameRegistry} onSelect={(game) => void play(game)} />
        </PageContainer>
      )}
      {showRegistration && (
        <RegistrationPage client={registrationClient} onCancel={returnToArcade} onSuccess={returnToArcade} />
      )}
      {showLogin && (
        <LoginPage client={loginClient} onCancel={returnToArcade} onSuccess={returnToArcade} />
      )}
      {showAccount && identity.state.status === 'authenticated' && <AccountPage client={profileClient} passwordClient={passwordClient} />}
      {showAdminUsers && identity.state.status === 'authenticated' && identity.state.user.role === 'ADMIN' && <AdminUsersPage client={adminUsersClient} />}
    </AppShell>
  )
}
