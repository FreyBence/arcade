import type { GameDefinition } from '../../../../arcade/types'
import { Card } from '../Card'
import { IconTile } from '../IconTile'
import './GameCard.css'

export interface GameCardProps {
  game: Pick<GameDefinition, 'id' | 'title' | 'description' | 'icon'>
  onSelect: (gameId: GameDefinition['id']) => void
}

export function GameCard({ game, onSelect }: GameCardProps) {
  return (
    <Card interactive className="game-card" onClick={() => onSelect(game.id)} aria-label={`Play ${game.title}`}>
      <IconTile aria-hidden="true">{game.icon}</IconTile>
      <span className="game-card__copy">
        <strong className="game-card__title">{game.title}</strong>
        <span className="game-card__description">{game.description}</span>
      </span>
      <span className="game-card__indicator" aria-hidden="true">→</span>
    </Card>
  )
}
