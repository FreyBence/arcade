# Mobile Arcade — Agent Guide

## Project purpose

Mobile Arcade is a browser-first collection of lightweight games for Safari and Chrome on phones, tablets, and desktops.

Read the relevant project specification or rule before making changes:

- `docs/architecture.md` — arcade architecture, game lifecycle, and module boundaries
- `docs/user-management.md` — identity, authentication, progress, rewards, and merge requirements
- `rules/testing.md` — unit-testing requirements and data-driven test convention
- `rules/version-control.md` — branch, commit, merge, and cleanup requirements

## Stack

- TypeScript
- React for the application shell and non-game UI
- Phaser for game rendering and interaction
- Vite for local development and production builds
- Browser storage for local persistence initially

Do not introduce a backend, PostgreSQL, Prisma, Remix, authentication, or cloud persistence unless the task explicitly requires it.

## Engineering expectations

- Prefer small, focused changes and preserve existing public contracts unless the task needs an intentional migration.
- Prioritize mobile responsiveness, touch usability, and Safari/Chrome compatibility.
- Run `npm run lint` and `npm run build` after implementation when Node.js is available.
