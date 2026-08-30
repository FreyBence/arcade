import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import './Card.css'

interface CardBaseProps {
  children: ReactNode
}

export interface StaticCardProps
  extends CardBaseProps,
    Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onClick'> {
  interactive?: false
}

export interface InteractiveCardProps
  extends CardBaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  interactive: true
}

export type CardProps = StaticCardProps | InteractiveCardProps

export function Card(props: CardProps) {
  if (props.interactive) {
    const { children, className, type = 'button', interactive: _interactive, ...buttonProps } = props
    void _interactive
    const classes = ['card', 'card--interactive', className].filter(Boolean).join(' ')

    return <button {...buttonProps} type={type} className={classes}>{children}</button>
  }

  const { children, className, interactive: _interactive, ...divProps } = props
  void _interactive
  const classes = ['card', className].filter(Boolean).join(' ')

  return <div {...divProps} className={classes}>{children}</div>
}
