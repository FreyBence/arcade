import type { LabelHTMLAttributes } from 'react'
import { useFormField } from '../FormField/useFormField'
import './Label.css'

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>

export function Label({ htmlFor, className, ...props }: LabelProps) {
  const field = useFormField()
  const classes = ['form-label', className].filter(Boolean).join(' ')

  return <label {...props} htmlFor={htmlFor ?? field?.controlId} className={classes} />
}
