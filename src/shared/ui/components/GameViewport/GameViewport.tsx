import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import './GameViewport.css'

export interface GameViewportProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean
  fullscreen?: boolean
  children?: ReactNode
}

export const GameViewport = forwardRef<HTMLDivElement, GameViewportProps>(function GameViewport({ active = true, fullscreen = false, children, className, ...props }, ref) {
  const classes = ['game-viewport', active && 'game-viewport--active', fullscreen && 'game-viewport--fullscreen', className].filter(Boolean).join(' ')
  return <div {...props} ref={ref} className={classes}>{children}</div>
})
