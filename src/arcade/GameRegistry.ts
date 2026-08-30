import type { GameDefinition } from './types'

export const gameRegistry: readonly GameDefinition[] = [
  {
    id: 'starter-game',
    title: 'Starter Game',
    description: 'A small example module that proves the arcade lifecycle.',
    icon: '✦',
    load: () => import('../games/starter-game'),
  },
]
