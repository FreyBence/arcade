import { Button } from '../../shared/ui'

export interface GoogleAuthenticationButtonProps {
  disabled?: boolean
  startAuthentication?: () => void
}

export function GoogleAuthenticationButton({
  disabled,
  startAuthentication = () => window.location.assign('/api/auth/google'),
}: GoogleAuthenticationButtonProps) {
  return <Button variant="secondary" disabled={disabled} onClick={startAuthentication}>Continue with Google</Button>
}
