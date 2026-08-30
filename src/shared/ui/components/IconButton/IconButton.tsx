import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { ButtonSize, ButtonVariant } from '../Button'
import './IconButton.css'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  'aria-label': string
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  children: ReactNode
}

export function IconButton({
  variant = 'secondary',
  size = 'medium',
  isLoading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: IconButtonProps) {
  const classes = ['button', 'icon-button', `button--${variant}`, `icon-button--${size}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button {...props} type={type} className={classes} disabled={disabled || isLoading} aria-busy={isLoading || undefined}>
      {isLoading ? <span className="button__spinner" aria-hidden="true" /> : children}
    </button>
  )
}
