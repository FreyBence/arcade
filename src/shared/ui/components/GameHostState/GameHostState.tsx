import type { HTMLAttributes } from 'react'
import './GameHostState.css'

type GameHostStateProps = Omit<HTMLAttributes<HTMLDivElement>, 'role'>

export function GameLoadingState({ className, ...props }: GameHostStateProps) {
  const classes = ['game-host-state', className].filter(Boolean).join(' ')
  return <div {...props} className={classes} role="status"><span className="game-host-state__spinner" aria-hidden="true" />Loading game…</div>
}

export interface GameErrorStateProps extends GameHostStateProps { message?: string }

export function GameErrorState({ message = 'The game could not be loaded. Return to the arcade and try again.', className, ...props }: GameErrorStateProps) {
  const classes = ['game-host-state', 'game-host-state--error', className].filter(Boolean).join(' ')
  return <div {...props} className={classes} role="alert">{message}</div>
}
