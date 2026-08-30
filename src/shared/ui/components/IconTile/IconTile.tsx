import type { HTMLAttributes, ReactNode } from 'react'
import './IconTile.css'

export interface IconTileProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
}

export function IconTile({ children, className, ...props }: IconTileProps) {
  const classes = ['icon-tile', className].filter(Boolean).join(' ')

  return <span {...props} className={classes}>{children}</span>
}
