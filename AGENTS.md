# Mobile Arcade — Agent Guide

## Project purpose

Mobile Arcade is a browser-first collection of lightweight games for Safari and Chrome on phones, tablets, and desktops.

Read the relevant project specification or rule before making changes:

- `docs/architecture.md` — arcade architecture, game lifecycle, and module boundaries
- `docs/user-management.md` — identity, authentication, progress, rewards, and merge requirements
- `docs/ui-design-system.md` — authoritative design system for shared application UI
- `rules/testing.md` — unit-testing requirements and data-driven test convention
- `rules/version-control.md` — branch, commit, merge, and cleanup requirements

## Shared application UI

Before creating or modifying application-level UI, read
`docs/ui-design-system.md` and follow it as the
authoritative specification for the shared React application shell.

- Use centralized semantic design tokens. Do not hard-code theme colors,
  spacing, radii, typography roles, breakpoints, or motion values when a token
  exists or belongs in the token layer.
- Reuse an existing shared UI component first, then an existing named variant,
  before creating a new component or local style.
- Express reusable visual differences as named component variants. Repeated
  local styling exceptions must be reviewed as candidates for a shared token,
  component, or variant.
- Keep the ownership boundary explicit: the shared design system governs the
  React-owned application shell and other application-level UI. Game-owned UI
  remains inside its game module and may use a different visual language unless
  it explicitly reuses an application component.
- Follow the specification's accessibility and responsive requirements,
  including semantic HTML, keyboard access, visible focus, accessible labels,
  sufficient contrast, 44 by 44 CSS-pixel touch targets, reduced-motion
  support, safe-area handling, and operation from 320 px through desktop widths.
- Intentional local exceptions are allowed only when justified by the
  specification's exception policy. Keep them scoped and document the concrete
  functional, responsive, accessibility, platform, or ownership reason.

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
