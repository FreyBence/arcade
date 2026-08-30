import type { InputProps } from '../Input'
import { Input } from '../Input'

export type PasswordInputProps = Omit<InputProps, 'type'>

export function PasswordInput(props: PasswordInputProps) {
  return <Input {...props} type="password" />
}
