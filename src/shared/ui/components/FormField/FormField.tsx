import { useId, type HTMLAttributes, type ReactNode } from 'react'
import { FormFieldContext } from './useFormField'
import './FormField.css'

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  disabled?: boolean
  invalid?: boolean
}

export function FormField({
  id,
  disabled = false,
  invalid = false,
  className,
  children,
  ...props
}: FormFieldProps) {
  const generatedId = useId()
  const controlId = id ?? `form-field-${generatedId.replace(/:/g, '')}`
  const classes = ['form-field', className].filter(Boolean).join(' ')

  return (
    <FormFieldContext.Provider
      value={{ controlId, messageId: `${controlId}-message`, disabled, invalid }}
    >
      <div {...props} className={classes} data-disabled={disabled || undefined} data-invalid={invalid || undefined}>
        {children}
      </div>
    </FormFieldContext.Provider>
  )
}
