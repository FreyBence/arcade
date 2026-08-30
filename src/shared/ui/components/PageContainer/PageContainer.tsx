import type { HTMLAttributes, ReactNode } from 'react'
import './PageContainer.css'

export type PageContainerSpacing = 'standard' | 'hero'

export interface PageContainerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode
  spacing?: PageContainerSpacing
}

export function PageContainer({ children, className, spacing = 'standard', ...props }: PageContainerProps) {
  const classes = ['page-container', `page-container--${spacing}`, className].filter(Boolean).join(' ')

  return <div {...props} className={classes}>{children}</div>
}
