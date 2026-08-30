import type { HTMLAttributes, ReactNode } from 'react'
import './FeedbackState.css'

type FeedbackStateProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title: ReactNode
  message?: ReactNode
  action?: ReactNode
  icon?: ReactNode
}

type StateVariant = 'loading' | 'empty' | 'error' | 'success'

function FeedbackState({ variant, title, message, action, icon, className, ...props }: FeedbackStateProps & { variant: StateVariant }) {
  const role = variant === 'error' ? 'alert' : 'status'
  const classes = ['feedback-state', `feedback-state--${variant}`, className].filter(Boolean).join(' ')
  const defaultIcon = variant === 'loading' ? <span className="feedback-state__spinner" /> : <span>{variant === 'success' ? '✓' : variant === 'error' ? '!' : '—'}</span>

  return (
    <div {...props} className={classes} role={role} aria-busy={variant === 'loading' || undefined}>
      <div className="feedback-state__icon" aria-hidden="true">{icon ?? defaultIcon}</div>
      <div className="feedback-state__content">
        <h2 className="feedback-state__title">{title}</h2>
        {message && <div className="feedback-state__message">{message}</div>}
      </div>
      {action && <div className="feedback-state__action">{action}</div>}
    </div>
  )
}

export type { FeedbackStateProps }

export function LoadingState(props: FeedbackStateProps) { return <FeedbackState {...props} variant="loading" /> }
export function EmptyState(props: FeedbackStateProps) { return <FeedbackState {...props} variant="empty" /> }
export function ErrorState(props: FeedbackStateProps) { return <FeedbackState {...props} variant="error" /> }
export function SuccessState(props: FeedbackStateProps) { return <FeedbackState {...props} variant="success" /> }
