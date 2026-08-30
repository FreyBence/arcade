import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import './GameViewport.css'

export interface GameViewportProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean
  children?: ReactNode
}

export const GameViewport = forwardRef<HTMLDivElement, GameViewportProps>(function GameViewport({ active = true, children, className, ...props }, ref) {
  const classes = ['game-viewport', active && 'game-viewport--active', className].filter(Boolean).join(' ')
  return <div {...props} ref={ref} className={classes}>{children}</div>
})
