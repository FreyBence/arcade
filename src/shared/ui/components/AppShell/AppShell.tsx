import type { HTMLAttributes, ReactNode } from 'react'
import './AppShell.css'

export interface AppShellProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode
  header?: ReactNode
  overlays?: ReactNode
}

export function AppShell({ children, className, header, overlays, ...props }: AppShellProps) {
  const classes = ['app-shell', className].filter(Boolean).join(' ')

  return (
    <div {...props} className={classes}>
      {header}
      <main className="app-shell__main">{children}</main>
      <div id="app-overlay-root" className="app-shell__overlays">{overlays}</div>
    </div>
  )
}
