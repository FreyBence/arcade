import type { GameDefinition } from '../../../../arcade/types'
import { GameCard } from '../GameCard'
import './GameCatalogue.css'

export interface GameCatalogueProps {
  games: readonly GameDefinition[]
  onSelect: (game: GameDefinition) => void
}

export function GameCatalogue({ games, onSelect }: GameCatalogueProps) {
  return <div className="game-catalogue">{games.map((game) => (
    <GameCard key={game.id} game={game} onSelect={() => onSelect(game)} />
  ))}</div>
}
