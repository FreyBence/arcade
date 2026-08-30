# Mobile Arcade — Agent Guide

## Project purpose

Mobile Arcade is a browser-first collection of lightweight games for Safari and Chrome on phones, tablets, and desktops.

Read the relevant project specification before making architecture or user-management changes:

- `docs/architecture.md` — arcade architecture, game lifecycle, and module boundaries
- `docs/user-management.md` — identity, authentication, progress, rewards, and merge requirements

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
- Run `npm run build` after implementation when Node.js is available.
