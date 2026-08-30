import type { HTMLAttributes, ReactNode } from 'react'
import { Button, type ButtonProps } from '../Button'
import './AppHeader.css'

export interface AppHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  actions?: ReactNode
  brand?: ReactNode
  homeLabel?: string
  onHome: () => void
}

export interface AppHeaderActionProps extends Omit<ButtonProps, 'aria-label' | 'children'> {
  collapseOnSmall?: boolean
  icon: ReactNode
  label: string
}

export function AppHeaderAction({
  className,
  collapseOnSmall = false,
  icon,
  label,
  variant = 'ghost',
  ...props
}: AppHeaderActionProps) {
  const classes = [collapseOnSmall && 'app-header__collapsible-action', className]
    .filter(Boolean)
    .join(' ')

  return (
    <Button {...props} className={classes} variant={variant} aria-label={label}>
      <span className="app-header__action-icon" aria-hidden="true">{icon}</span>
      <span className="app-header__action-label">{label}</span>
    </Button>
  )
}

export function AppHeader({
  actions,
  brand = 'Mobile Arcade',
  className,
  homeLabel = 'Return to arcade home',
  onHome,
  ...props
}: AppHeaderProps) {
  const classes = ['app-header', className].filter(Boolean).join(' ')

  return (
    <header {...props} className={classes}>
      <Button
        className="app-header__brand"
        variant="ghost"
        onClick={onHome}
        aria-label={homeLabel}
      >
        {brand}
      </Button>
      {actions && (
        <nav className="app-header__actions" aria-label="Application actions">
          {actions}
        </nav>
      )}
    </header>
  )
}
