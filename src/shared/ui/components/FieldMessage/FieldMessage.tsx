import type { HTMLAttributes } from 'react'
import { useFormField } from '../FormField/useFormField'
import './FieldMessage.css'

export type FieldMessageVariant = 'hint' | 'error'

export interface FieldMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: FieldMessageVariant
}

export function FieldMessage({ id, variant = 'hint', className, ...props }: FieldMessageProps) {
  const field = useFormField()
  const classes = ['field-message', `field-message--${variant}`, className].filter(Boolean).join(' ')

  return (
    <p
      {...props}
      id={id ?? field?.messageId}
      className={classes}
      role={variant === 'error' ? 'alert' : undefined}
    />
  )
}
