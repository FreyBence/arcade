import { IconButton } from '../IconButton'
import './FullscreenButton.css'

export interface FullscreenButtonProps {
  fullscreen: boolean
  onToggle: () => void
}

export function FullscreenButton({ fullscreen, onToggle }: FullscreenButtonProps) {
  const label = fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'

  return (
    <IconButton className="fullscreen-button" onClick={onToggle} aria-label={label}>
      <span aria-hidden="true">{fullscreen ? '×' : '⛶'}</span>
    </IconButton>
  )
}
