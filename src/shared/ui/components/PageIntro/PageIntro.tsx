import type { HTMLAttributes, ReactNode } from 'react'
import './PageIntro.css'

export interface PageIntroProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
}

export function PageIntro({ className, description, eyebrow, title, ...props }: PageIntroProps) {
  const classes = ['page-intro', className].filter(Boolean).join(' ')

  return (
    <header {...props} className={classes}>
      {eyebrow && <p className="page-intro__eyebrow">{eyebrow}</p>}
      <h1 className="page-intro__title">{title}</h1>
      {description && <p className="page-intro__description">{description}</p>}
    </header>
  )
}
