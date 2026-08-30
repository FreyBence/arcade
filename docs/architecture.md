# Mobile Arcade Architecture

This is the baseline technical specification for Mobile Arcade. It consolidates the architectural rules formerly maintained in `AGENTS.md` and the base architecture planning document.

## Platform and stack

- Build a browser-first web application for Safari and Chrome on phones, tablets, and desktops.
- Use TypeScript, React for the application shell and non-game UI, Phaser for game rendering and interaction, and Vite-compatible tooling.
- Use browser storage for local-only settings and progress when sufficient. PostgreSQL and Prisma are introduced only when server-side functionality, such as accounts or cloud saves, is required.
- Expected initial traffic is low. Prefer maintainability over premature scaling or infrastructure.

## Application boundaries

- React owns the arcade catalogue, navigation, settings, profile/account UI, and other surrounding web UI.
- Phaser owns the interactive game surface: scenes, game objects, input, animation, assets, cameras, and the game loop.
- Do not embed React into each Phaser game.
- Keep pure gameplay rules and state independent of Phaser whenever practical, especially where unit tests are useful.
- Use pointer input as the common touch and mouse abstraction. Add keyboard controls only where appropriate.

## Game runtime and lifecycle

- Maintain exactly one long-lived `Phaser.Game` runtime for the arcade; never create a new runtime for every game.
- `GameManager` owns the single-active-game invariant. Route game start, stop, exit, and switching through it.
- Games are loaded dynamically through `GameRegistry`; do not eagerly include all games in the initial bundle.
- On exit or switch, stop the active scene and release all game-specific listeners, timers, tweens, objects, and references.
- Browser-cached assets may remain cached after a game exits. That is distinct from an active game runtime.

## Module boundaries and layout

```text
src/
  arcade/       # React shell, registry, manager, and arcade contracts
  games/<id>/   # A self-contained game module
  shared/       # Small, proven reusable infrastructure
```

- Each game owns its gameplay logic, Phaser scenes, game-specific UI, assets, and internal menus inside `src/games/<id>/`.
- Games must remain independent: a game must not import another game's implementation.
- Move code into `src/shared/` only after genuine reuse is demonstrated; it is not a dumping ground.

## Adding a game

1. Create `src/games/<game-id>/index.ts`.
2. Export a `createScene()` function compatible with `GameModule` in `src/arcade/types.ts`.
3. Add its metadata and `load: () => import(...)` entry to `src/arcade/GameRegistry.ts`.
4. Clean up all external resources during Phaser shutdown or destroy.
5. Keep game-rule tests separate from Phaser rendering code.

## Verification

For lifecycle changes, manually verify opening a game, interacting with it, exiting, reopening it, and switching between games. Run `npm run build` after implementation when Node.js is available.
