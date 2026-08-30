import {
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from 'react'
import { createPortal } from 'react-dom'
import './Dialog.css'

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export interface DialogProps {
  open: boolean
  title: ReactNode
  children: ReactNode
  actions?: ReactNode
  onDismiss?: () => void
  dismissible?: boolean
  initialFocusRef?: RefObject<HTMLElement | null>
}

export function Dialog({
  open,
  title,
  children,
  actions,
  onDismiss,
  dismissible = true,
  initialFocusRef,
}: DialogProps) {
  const titleId = useId()
  const bodyId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const bodyChildren = Array.from(document.body.children)
    const previousOverflow = document.body.style.overflow
    const changedElements = bodyChildren.map((element) => ({
      element: element as HTMLElement,
      inert: (element as HTMLElement).inert,
      ariaHidden: element.getAttribute('aria-hidden'),
    }))

    for (const { element } of changedElements) {
      if (!element.hasAttribute('data-dialog-overlay-root')) {
        element.inert = true
        element.setAttribute('aria-hidden', 'true')
      }
    }
    document.body.style.overflow = 'hidden'

    const focusTarget = initialFocusRef?.current
      ?? dialogRef.current?.querySelector<HTMLElement>(focusableSelector)
      ?? dialogRef.current
    focusTarget?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      for (const { element, inert, ariaHidden } of changedElements) {
        element.inert = inert
        if (ariaHidden === null) element.removeAttribute('aria-hidden')
        else element.setAttribute('aria-hidden', ariaHidden)
      }
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [initialFocusRef, open])

  if (!open) return null

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && dismissible) {
      event.preventDefault()
      onDismiss?.()
      return
    }

    if (event.key !== 'Tab') return
    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    )
    if (focusableElements.length === 0) {
      event.preventDefault()
      dialogRef.current?.focus()
      return
    }

    const first = focusableElements[0]
    const last = focusableElements[focusableElements.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div
      className="dialog-overlay"
      data-dialog-overlay-root=""
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onDismiss?.()
      }}
    >
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="dialog__content">
          <h2 className="dialog__title" id={titleId}>{title}</h2>
          <div className="dialog__body" id={bodyId}>{children}</div>
        </div>
        {actions && <div className="dialog__actions">{actions}</div>}
      </div>
    </div>,
    document.body,
  )
}
