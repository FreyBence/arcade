import type { InputHTMLAttributes } from 'react'
import { useFormField } from '../FormField/useFormField'
import './Input.css'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export function Input({
  id,
  disabled,
  invalid,
  className,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: InputProps) {
  const field = useFormField()
  const isInvalid = invalid ?? field?.invalid ?? false
  const classes = ['form-input', className].filter(Boolean).join(' ')

  return (
    <input
      {...props}
      id={id ?? field?.controlId}
      className={classes}
      disabled={disabled ?? field?.disabled}
      aria-describedby={ariaDescribedBy ?? field?.messageId}
      aria-invalid={ariaInvalid ?? (isInvalid || undefined)}
    />
  )
}
