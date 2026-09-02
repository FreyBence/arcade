# Current Architecture Audit

This document records the Mobile Arcade architecture as it currently exists in
the repository. It supports GitHub issue
[#79](https://github.com/FreyBence/arcade/issues/79) and provides a baseline for
subsequent structure and architecture cleanup work.

The existing architecture specifications remain authoritative:

- [`architecture.md`](../architecture.md) defines the application shell, game
  lifecycle, and module boundaries.
- [`user-management.md`](../user-management.md) defines identity,
  authentication, progress, rewards, and guest-to-user merging.
- [`ui-design-system.md`](../ui-design-system.md) defines the shared React UI
  system.

This audit describes the implementation; it does not propose a replacement
architecture. Findings in this document are candidates for focused cleanup
tickets, not authorization for broad redesign or behavioral changes.

## Implemented system overview

```text
Browser
  -> React application shell
       -> Arcade catalogue and game host
       -> Authentication, account, and administration pages
       -> Shared UI design system
       -> Client identity store
            -> In-memory access token
            -> Server-backed authenticated session
            -> Browser-local guest UUID

React game host
  -> GameManager
       -> One long-lived Phaser.Game
            -> One dynamically loaded active scene

Browser API clients
  -> /api/*
       -> Node HTTP server
            -> API router
            -> Request handlers and services
            -> Authentication and authorization
            -> Repository interfaces and Prisma adapters
            -> PostgreSQL
```

## Repository ownership

| Area | Current responsibility |
| --- | --- |
| `src/arcade/` | React application shell, game orchestration, application pages, and browser API clients |
| `src/games/<id>/` | Self-contained Phaser game implementation and game-owned behavior |
| `src/shared/ui/` | Shared React application UI components and design-system styles |
| `src/shared/identity/` | Browser identity, access-token, authenticated-session, and guest-identity infrastructure |
| `src/shared/auth/` | Authentication contracts shared by client and server, currently user roles |
| `src/shared/profile/` | Profile-image contracts shared by client and server |
| `src/server/` | Node HTTP serving, API routing, and server composition |
| `src/server/auth/` | Credentials, authentication, sessions, external identity, and authorization |
| `src/server/profile/` | Authenticated profile operations |
| `src/server/admin/` | Administrator-only operations |
| `prisma/` | PostgreSQL schema and migrations |
| `generated/` | Generated Prisma client |

## React application shell

`src/main.tsx` mounts `ArcadeApp`, which is the current client-side composition
root. `ArcadeApp` owns:

- catalogue, login, registration, account, and administration page selection;
- header actions and logout;
- client identity initialization;
- `GameManager` creation and destruction;
- game loading, exit, loading-error, and fullscreen state.

Page selection is held in local React state. The application does not currently
use URL-based client routing.

Feature-specific browser UI and API clients are grouped below the arcade shell:

```text
src/arcade/auth/       registration and login UI and clients
src/arcade/account/    profile and password UI and clients
src/arcade/admin/      administrator user-management UI and client
```

Reusable browser identity mechanics are under `src/shared/identity/`, while the
feature workflows remain with their arcade UI owners.

## Phaser runtime and games

`GameManager` implements the documented single-runtime lifecycle:

- it creates one long-lived `Phaser.Game` instance;
- it permits one active scene at a time;
- it stops and removes the active scene before switching;
- it ignores stale asynchronous game loads;
- it cleans up resize, orientation, fullscreen, and observer listeners;
- it destroys the Phaser runtime when the React host is destroyed.

`GameRegistry` owns game metadata and dynamic imports. The repository currently
contains one game, `src/games/starter-game/`. It is loaded only when selected.
No game imports another game's implementation.

The implemented game runtime therefore follows the documented React/Phaser
ownership boundary and dynamic-loading rules.

## Browser identity and sessions

The browser identity system supports two states in addition to initialization:

- a guest identified by a UUID persisted in `localStorage`;
- an authenticated user restored from the server.

The access token is held in module memory. A browser session is restored by
calling `/api/refresh` and then `/api/me`. The long-lived refresh credential is
managed by the server as a cookie. Logout revokes the server session, clears the
access token, and returns the client identity store to guest state.

The browser currently stores only the guest UUID. Guest progress, progress
events, checkpoints, and merge decisions have not been implemented.

## Server request flow

The production server is composed as follows:

```text
server.ts
  -> configuredApplication.ts
       -> applicationApi.ts
            -> handlers, services, and repositories
       -> apiRouter.ts
```

`server.ts` is a small Node HTTP host. It converts Node requests to Web API
`Request` objects, routes `/api/*` requests to the API application, serves the
Vite build output, falls back to `index.html`, and disconnects Prisma during
shutdown.

`applicationApi.ts` is the effective server composition root. It creates shared
authentication and persistence dependencies and wires handlers for:

- registration and login;
- session refresh and logout;
- current-user identity;
- profile and password updates;
- Google OpenID authentication;
- administrator user search;
- administrator Dino Coin updates;
- administrator role updates.

`apiRouter.ts` maps HTTP methods and paths to those handlers. No server web
framework or decorator-based controller layer is used.

Most server features follow this dependency flow:

```text
request
  -> handler
       -> validation and authentication/authorization middleware
            -> service or domain operation
                 -> repository interface
                      -> Prisma repository
```

Authentication is divided into focused areas for access tokens, refresh
sessions, request authentication, role authorization, Google authentication,
password changes, and administrator bootstrap.

## Persistence

The Prisma schema currently implements three models:

- `User` stores identity, an optional password hash, the `ADMIN` or `VIEWER`
  role, Dino Coins, an optional profile image, email verification state, and
  timestamps.
- `Session` stores a hashed refresh token, expiry, and revocation state.
- `ExternalIdentity` stores a provider and stable provider subject linked to a
  user.

The nullable password hash permits accounts created exclusively through an
external identity provider.

The following documented progress concepts are not implemented in the Prisma
schema or application code:

- user or guest per-game progress snapshots;
- append-only progress events;
- event idempotency and checkpoints;
- guest-to-user progress merging;
- authenticated progress persistence;
- reward-event validation and conversion into Dino Coins.

These are planned features, not cleanup work implied by this audit.

## Architectural findings

### 1. Shared UI depends on the arcade layer

`GameCard` and `GameCatalogue` under `src/shared/ui/` import `GameDefinition`
from `src/arcade/types.ts`. This makes shared infrastructure depend on one of
its consumers and leaves ownership unclear.

A cleanup ticket should determine whether these components are arcade-owned or
whether their existing props can be simplified to UI-owned structural values.
It should not introduce a new generalized game-domain abstraction solely for
hypothetical reuse.

### 2. Parallel server composition roots appear obsolete

`src/server/auth/registrationApi.ts` and
`src/server/auth/refresh/authenticationApi.ts` each create a Prisma client and a
partial API composition. Production instead uses `configuredApplication.ts`
and `applicationApi.ts`.

The partial composition roots remain exported through auth barrel files but
have no production callers in the repository. A cleanup ticket should confirm
that they have no external consumer and then remove or consolidate them.

### 3. Generic HTTP response infrastructure is auth-owned

`jsonResponse` is located under `src/server/auth/utils/`, although it is used by
the top-level API router, profile handlers, and administrator handlers. Its
location communicates authentication ownership that does not match its actual
usage.

### 4. The Prisma user repository spans multiple feature owners

`PrismaUserRepository` lives under `src/server/auth/` but implements contracts
for registration, login, administrator bootstrap, password changes, and the
sibling profile feature.

This may remain one persistence adapter, but its current location does not make
its cross-feature ownership explicit. Cleanup should prefer relocation or
simplification over adding another repository abstraction.

### 5. Auth barrel files expose apparently unused APIs

Authentication barrel files export the parallel composition roots and several
middleware helpers beyond the API used by the production composition root.
Cleanup should verify consumers before removing unused exports and their
associated implementation together.

### 6. Progress architecture is not implemented

The documented `ProgressService`, guest progress storage, snapshots, event
history, idempotent merging, and authenticated persistence do not exist yet.
This is an implementation gap for future feature tickets, not a reason to add
placeholder layers during architecture cleanup.

### 7. Guest identity is narrower than the documented logical model

The implementation persists a guest UUID only. The user-management document's
logical `GuestSession` also describes created and last-seen data. A future
identity or progress ticket should decide whether those fields are needed when
guest progress is implemented.

### 8. `ArcadeApp` is accumulating orchestration responsibilities

`ArcadeApp` currently coordinates game lifecycle, page selection,
authentication actions, account navigation, administrator navigation, and
notifications. All of these responsibilities still fall within the documented
React-shell boundary, so this is not currently an architecture violation.

Future cleanup should split it only where doing so clearly reduces complexity
while preserving behavior. This finding does not justify introducing a router
or application-state framework by itself.

## Cleanup constraints

Subsequent cleanup work based on this audit should follow these rules:

- Preserve existing behavior unless the cleanup ticket explicitly requires a
  behavioral change.
- Treat the existing architecture documents as the baseline.
- Prefer moving, simplifying, merging, or removing existing code over adding
  layers or abstractions.
- Do not create abstractions solely for anticipated future reuse.
- Move code into `src/shared/` only when multiple real consumers demonstrate
  shared ownership.
- Keep application-shell code, game-owned code, server code, authentication,
  and future progress infrastructure within their documented ownership
  boundaries.
- Verify that code and exports have no callers before removing them.
- Keep cleanup tickets focused; do not combine structural cleanup with feature
  implementation or a broad architecture redesign.
- Record intentional exceptions when functional, accessibility, responsive,
  platform, or ownership requirements prevent normal placement.

## Audit conclusion

The core game lifecycle and the React/Phaser boundary closely follow the base
architecture. Authentication, session persistence, external identities,
profile management, and administrator operations have extended the original
three-directory layout into a practical client/server application.

The main cleanup opportunities are dependency direction and unclear ownership,
not a need for a new architecture. Progress and merging remain deliberately
unimplemented and should be addressed only by their own feature tickets.
