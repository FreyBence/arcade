import type { HTMLAttributes, ReactNode } from 'react'
import { IconTile } from '../IconTile'
import './GamePageHeader.css'

export interface GamePageHeaderProps extends HTMLAttributes<HTMLElement> {
  icon: ReactNode
  title: string
}

export function GamePageHeader({ icon, title, className, ...props }: GamePageHeaderProps) {
  const classes = ['game-page-header', className].filter(Boolean).join(' ')
  return <header {...props} className={classes}><IconTile aria-hidden="true">{icon}</IconTile><h1>{title}</h1></header>
}
