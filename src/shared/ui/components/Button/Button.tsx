import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'small' | 'medium' | 'large'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  loadingLabel?: string
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  loadingLabel = 'Loading',
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = ['button', `button--${variant}`, `button--${size}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      {...props}
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
    >
      {isLoading && <span className="button__spinner" aria-hidden="true" />}
      <span className={isLoading ? 'button__content button__content--loading' : 'button__content'}>
        {isLoading ? loadingLabel : children}
      </span>
    </button>
  )
}
