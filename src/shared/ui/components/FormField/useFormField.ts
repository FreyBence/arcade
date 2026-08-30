import { createContext, useContext } from 'react'

export interface FormFieldContextValue {
  controlId: string
  messageId: string
  disabled: boolean
  invalid: boolean
}

export const FormFieldContext = createContext<FormFieldContextValue | null>(null)

export function useFormField() {
  return useContext(FormFieldContext)
}
