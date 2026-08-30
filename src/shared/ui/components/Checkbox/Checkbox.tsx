import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { useFormField } from '../FormField/useFormField'
import './Checkbox.css'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  children: ReactNode
  invalid?: boolean
}

export function Checkbox({
  id,
  disabled,
  invalid,
  className,
  children,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: CheckboxProps) {
  const generatedId = useId()
  const field = useFormField()
  const controlId = id ?? field?.controlId ?? `checkbox-${generatedId.replace(/:/g, '')}`
  const isInvalid = invalid ?? field?.invalid ?? false
  const classes = ['checkbox', className].filter(Boolean).join(' ')

  return (
    <label className={classes} htmlFor={controlId}>
      <input
        {...props}
        id={controlId}
        className="checkbox__control"
        type="checkbox"
        disabled={disabled ?? field?.disabled}
        aria-describedby={ariaDescribedBy ?? field?.messageId}
        aria-invalid={ariaInvalid ?? (isInvalid || undefined)}
      />
      <span className="checkbox__box" aria-hidden="true" />
      <span className="checkbox__label">{children}</span>
    </label>
  )
}
