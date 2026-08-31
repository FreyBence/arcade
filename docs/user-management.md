# Mobile Arcade User Management and Progress

This specification extends the base arcade architecture with identity, authentication, persistent progress, rewards, and guest-to-user progress merging.

## Users and authorization

- Registered users have a name, email, password hash, role, Dino Coin balance, account metadata, and timestamps.
- Roles are `ADMIN` and `VIEWER`. A guest is an authentication state, not a database role, and users never select it.
- Management functionality requires authentication and server-side `ADMIN` authorization.
- Never store passwords in plaintext. Persist only a secure password hash.
- Use short-lived access tokens with a long-lived refresh token/session; the intended persistent-login period is about one year.
- Bootstrap the initial admin securely. Public registration must not grant `ADMIN`.

## Guest identity

- Anonymous visitors receive a browser-local, persisted guest session identifier; they do not create a PostgreSQL `User` row.
- Guest progress is local, survives ordinary browser restarts, and does not synchronize across devices.
- Clearing site data, changing browsers/devices, or equivalent local-storage loss can remove guest progress.

## Progress and rewards

- Store current per-game progress as a fast-access snapshot and meaningful mutations as an append-only event history.
- Events need a unique UUID event ID for idempotent retry and merging.
- Record meaningful events only, such as game or level completion, achievement unlock, reward earned, or purchase. Do not record frames, movements, or incremental state changes.
- Games define their own progress schema, event meanings, and merge logic. Shared infrastructure provides contracts, not game-specific merge rules.
- Use periodic checkpoints or compaction to prevent unbounded guest event histories; choose thresholds from real-game event volume.
- Guests do not have a persistent Dino Coin balance. Coin-producing actions are reward events; validated rewards are added to an authenticated balance only after an accepted merge.
- Once authenticated, currency and other valuable state are server-authoritative. Never trust the client to set an arbitrary balance.

## Guest-to-user merge

1. An anonymous visitor accumulates local snapshots and meaningful event history.
2. After login or registration, detect available guest progress and present a merge decision.
3. If accepted, merge the guest data into the authenticated account using that game's merge rules.
4. If rejected, permanently discard the guest data and leave the existing account progress unchanged.
5. Remove guest data only after successful server-side processing or explicit rejection.

Merge meaningful progress rather than blindly replacing the user's final snapshot. For example, a Sudoku merge might combine wins and games played while keeping the lower best time. Server-side processing must recognize previously processed event IDs so retries cannot duplicate progress or currency.

## Logical model and integration

- `User`: identity, password hash, role, Dino Coins, account metadata, timestamps.
- `Session`: user reference, refresh token/session data, expiry, timestamps, revocation state.
- `ExternalIdentity`: provider, stable provider subject, linked user, and timestamps. Provider credentials are never application session credentials.
- `GuestSession`: local guest identity and created/last-seen data only.
- `UserGameProgress` / `GuestGameProgress`: per-game current snapshot and version.
- `ProgressEvent`: event ID, game ID, type, payload, timestamp, and relevant version/checkpoint data.

The browser flow is:

```text
React / Arcade UI -> auth state -> application server -> auth, authorization, and progress API -> Prisma -> PostgreSQL
Games -> ProgressService -> local guest storage or authenticated server persistence
```

## Implementation decisions still open

- Exact progress-related Prisma/PostgreSQL schema and relations.
- Token/session mechanics, email verification, and account recovery.
- Guest storage mechanism and local-data versioning.
- Event payload conventions and checkpoint thresholds.
- The first game's concrete progress and merge rules.
- Offline synchronization and cross-device conflict resolution.
