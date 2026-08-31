# Mobile Arcade

Browser-first arcade shell based on the architecture plan in `docs/`.

## Requirements

- Node.js `^20.19.0`, `^22.13.0`, or `>=24`
- npm, included with Node.js
- Docker with Docker Compose, only when working with the local PostgreSQL database

Docker is optional for frontend-only development.

## Run locally

Install a supported Node.js release, then run:

```bash
npm install
npm run dev
```

## Code quality

Run ESLint before submitting changes:

```bash
npm run lint
```

The lint configuration uses type-aware TypeScript checks together with the recommended React Hooks and Vite React Refresh rules. Warnings fail the command, and unused ESLint suppression comments are reported as errors.

ESLint can automatically apply safe fixes where supported:

```bash
npm run lint:fix
```

Before opening a pull request, verify both linting and the production build:

```bash
npm run lint
npm run build
```

## Unit testing

Run the Vitest unit-test suite once with:

```bash
npm test
```

For continuous feedback while developing, use watch mode:

```bash
npm run test:watch
```

Add or update unit tests for every feature change. Tests should cover core behavior and public contracts, remain deterministic, and follow the data-driven `name`, `input`, and `expected` convention documented in [`rules/testing.md`](rules/testing.md).

Before opening a pull request, run the complete verification set:

```bash
npm test
npm run lint
npm run build
```

## Local database

Docker Compose runs PostgreSQL for local development. Copy `.env.example` to `.env` if it does not already exist, then start the database and apply migrations:

```bash
docker compose up -d database
npm run db:migrate
```

Check its readiness with `docker compose ps`. The database data persists in the `postgres_data` Docker volume. To remove the local database and all of its data, run `docker compose down -v`.

## Bootstrap the initial administrator

After applying database migrations, provide `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` as server-only environment variables, then run:

```bash
npm run admin:bootstrap
```

The command validates the values, hashes the password with the application password service, and creates an `ADMIN`. It is safe to repeat with the same email: an existing administrator is left unchanged. If that email belongs to a non-admin account, the command fails without changing its role or password. Do not commit real administrator credentials or expose them through `VITE_` variables.

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
