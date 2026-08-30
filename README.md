# Mobile Arcade

Browser-first arcade shell based on the architecture plan in `docs/`.

## Run locally

Install a current Node.js LTS release, then run:

```bash
npm install
npm run dev
```

## Local database

Docker Compose runs PostgreSQL for local development. Copy `.env.example` to `.env` if it does not already exist, then start the database and apply migrations:

```bash
docker compose up -d database
npm run db:migrate
```

Check its readiness with `docker compose ps`. The database data persists in the `postgres_data` Docker volume. To remove the local database and all of its data, run `docker compose down -v`.

## Architecture

- React renders the arcade catalogue and surrounding application UI.
- `GameRegistry` lists games with dynamic imports, so a game is only downloaded when selected.
- `GameManager` owns one long-lived `Phaser.Game` instance and ensures that only one game scene is active.
- A game module owns its scenes, logic, UI, and assets. Keep reusable code in `src/shared/` only once it is genuinely shared.

## Add a game

Create `src/games/<game-id>/index.ts` exporting `createScene`, then add a metadata entry and dynamic loader in `src/arcade/GameRegistry.ts`.

```ts
{
  id: 'my-game',
  title: 'My Game',
  description: 'A short catalogue description.',
  icon: '🎮',
  load: () => import('../games/my-game'),
}
```

Each scene should clean up its own timers, listeners, and game-specific resources during Phaser's normal shutdown/destroy lifecycle.
