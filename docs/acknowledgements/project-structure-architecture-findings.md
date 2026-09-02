# Project Structure and Architecture Findings

This document is the persistent findings register for GitHub issue
[#87](https://github.com/FreyBence/arcade/issues/87). It records the state of
the repository before EPIC-05 cleanup. Discovery and remediation are separate:
no finding in this report authorizes a refactor or behavior change by itself.

The audit baseline is [`architecture.md`](../architecture.md),
[`user-management.md`](../user-management.md), and
[`ui-design-system.md`](../ui-design-system.md). The descriptive snapshot in
[`current-architecture-audit.md`](current-architecture-audit.md) was also used,
but it is not an architecture rule.

## Executive summary

The core React/Phaser boundary and single-game lifecycle are consistent with
the documented architecture. The largest confirmed cleanup opportunities are
in the server and shared UI: three apparently obsolete API composition roots,
very fine-grained server feature slices, broad barrel exports, misplaced
cross-feature utilities and repositories, an inverted shared-UI dependency,
and repeated page layout styles.

Two concerns need an important correction. This project does **not** use Remix;
`package.json` specifies React, Vite, and a standalone Node HTTP host. React is
a UI library and does not provide a backend, route loaders, or route actions.
Vite builds and serves development assets but does not provide the production
application API. Consequently, a server host and a Node-to-Web-API adapter are
necessary under the selected stack. Remix could replace some of that code, but
adopting it would be an architecture migration, not removal of accidental
duplication.

Likewise, one global CSS file would not inherently improve the design system.
Component-local CSS gives ownership, dependency, and deletion boundaries. The
concrete problem is repeated page-level styling and missing reusable layout or
feedback variants, not the number of CSS files alone.

## Audit scope and evidence

The review covered application entry points, `src/arcade`, the game registry
and only current game module, `src/shared`, `src/server`, Prisma ownership,
package scripts and dependencies, production imports, tests, CSS imports, and
recent feature history. At the time of review:

- `src/main.tsx` mounts `ArcadeApp`; no routing package or Remix dependency is
  present.
- `ArcadeApp` selects catalogue, login, registration, account, and admin views
  with Boolean React state rather than URLs.
- `src/server/server.ts` is both the production static-file host and API host.
- `src/server/apiRouter.ts` declares 12 API routes.
- `src/server/admin/users` contains separate handler, validation, repository,
  type, barrel, and test files for a small cohesive admin-user capability.
- shared UI components generally own local CSS, while authentication, account,
  and admin pages add feature CSS.
- recent history shows the server structure grew incrementally through
  endpoint-sized issues, which explains much of the repeated file pattern.

## Findings

### Finding 1: The application framework decision is implicit

**Category:** Architecture

**Priority:** Medium

**Status:** Confirmed

**Location:** `package.json`, `src/main.tsx`, `src/server/server.ts`,
`src/server/nodeHttpAdapter.ts`, architecture documents

**Current State:** The implementation uses a Vite-built React single-page
application and a bespoke Node HTTP server. The architecture documents name
React and Vite-compatible tooling, but do not explicitly compare or record why
this stack was selected over a full-stack framework.

**Problem:** The absence of a recorded decision makes required infrastructure
look accidental. Future contributors can reasonably assume that React includes
server routing or that Remix conventions were intended, then attempt a broad
framework rewrite during cleanup.

**Expected Architecture:** Record whether the intended architecture remains a
Vite SPA plus Node API, or whether a separately scoped migration to a full-stack
React framework is desired. React alone is not a backend framework.

**Recommended Action:** Investigate and document the decision. Do not remove the
Node adapter unless the runtime architecture is changed first.

**Related Cleanup Ticket:** EPIC-05 follow-up to be assigned.

---

### Finding 2: Application pages have no URL routing model

**Category:** Architecture

**Priority:** Medium

**Status:** Needs Investigation

**Location:** `src/arcade/ArcadeApp.tsx`

**Current State:** Five Boolean/state conditions choose the catalogue, login,
registration, account, and administrator views. Page transitions do not update
the browser URL.

**Problem:** Views cannot be deep-linked, refreshed in place, bookmarked, or
navigated with normal browser back/forward behavior. Additional pages will add
more mutually exclusive state and reset logic to the application composition
root.

**Expected Architecture:** If these surfaces are intended to behave as pages,
they should have an explicit URL-to-view tree. This can be implemented with a
client router under Vite; it does not require Remix. If the product intentionally
behaves as a single transient screen, that decision should be recorded.

**Recommended Action:** Investigate product requirements, then introduce a
route tree in a separate behavioral ticket if URL navigation is required.

**Related Cleanup Ticket:** EPIC-05 follow-up to be assigned; framework
migration is out of scope.

---

### Finding 3: Obsolete parallel API composition roots remain exported

**Category:** Duplication

**Priority:** High

**Status:** Confirmed

**Location:** `src/server/auth/loginApi.ts`,
`src/server/auth/registrationApi.ts`,
`src/server/auth/refresh/authenticationApi.ts`, `src/server/auth/index.ts`,
`src/server/auth/refresh/index.ts`, `src/server/applicationApi.ts`

**Current State:** Production dependencies are composed by
`createApplicationApi`. Three older functions independently create Prisma
clients and partial authentication APIs. Production code has no callers for
them, but auth barrels still export them.

**Problem:** The parallel roots duplicate dependency wiring, obscure which
composition is authoritative, create multiple database-client ownership paths,
and can drift from production behavior.

**Expected Architecture:** One application composition root should own shared
server dependencies and lifecycle.

**Recommended Action:** Verify that no external consumer exists, then remove the
three partial roots and their exports or merge any still-required contract into
the production root.

**Related Cleanup Ticket:** EPIC-05 obsolete/duplicate server composition
cleanup ticket to be assigned.

---

### Finding 4: Endpoint-sized files fragment cohesive server capabilities

**Category:** Abstraction

**Priority:** Medium

**Status:** Confirmed

**Location:** `src/server/admin/users`, `src/server/auth`,
`src/server/auth/passwordChange`, `src/server/profile`

**Current State:** Many production files expose one short function, error, type,
or constant. For example, admin user search, Dino Coin mutation, and role
mutation are split into three handlers, two validation modules, a shared types
module, repository module, and barrel. Authentication repeats handler, service,
types, errors, validation, API, and index slices for individual endpoints.

**Problem:** Single responsibility has been interpreted at function level
rather than cohesive change-boundary level. Understanding or changing one
feature requires traversing many tiny files and barrels, while the files have
few independent consumers. This increases navigation and import overhead
without providing meaningful isolation.

**Expected Architecture:** A file should own a cohesive capability, not
necessarily exactly one function. Split a module when responsibilities change
independently, have different consumers, or need a real boundary. Tests may
remain separate without requiring every implementation helper to have a file.

**Recommended Action:** Review each feature slice and merge handler-local
validation, errors, and types where they have no independent ownership. Keep
services and repositories separate only where the dependency boundary is used.

**Related Cleanup Ticket:** EPIC-05 server feature-cohesion cleanup ticket to be
assigned.

---

### Finding 5: Broad barrel exports hide dependencies and preserve dead APIs

**Category:** Dependency

**Priority:** Medium

**Status:** Confirmed

**Location:** `src/server/auth/index.ts`, nested `index.ts` files under
`src/server/auth`, `src/server/admin/users/index.ts`

**Current State:** Auth barrels re-export handlers, services, repository
adapters, low-level types, middleware, errors, and obsolete composition roots.
Nested barrels are then re-exported through the root auth barrel.

**Problem:** Consumers do not reveal the actual owning module, export surface
area is much larger than production usage, circular dependencies become easier
to introduce, and obsolete code appears supported merely because it remains
exported.

**Expected Architecture:** Feature entry points should expose a small intentional
public contract. Server-internal composition may import directly from the
owning module.

**Recommended Action:** Inventory consumers, reduce barrel surfaces, and remove
exports with no supported caller. Do this together with Finding 3 to avoid
leaving dead implementations behind.

**Related Cleanup Ticket:** EPIC-05 dependency-surface cleanup ticket to be
assigned.

---

### Finding 6: Shared UI depends on the arcade domain

**Category:** Dependency

**Priority:** High

**Status:** Confirmed

**Location:** `src/shared/ui/components/GameCard/GameCard.tsx`,
`src/shared/ui/components/GameCatalogue/GameCatalogue.tsx`,
`src/arcade/types.ts`

**Current State:** Components under `src/shared/ui` import `GameDefinition`
from `src/arcade`.

**Problem:** Shared infrastructure depends on one of its consumers. This reverses
the intended dependency direction and couples reusable presentation components
to loading/runtime fields they do not own.

**Expected Architecture:** Either these game-specific components belong to the
arcade shell, or shared components accept UI-owned structural props without an
arcade-domain import.

**Recommended Action:** Move the catalogue components to `src/arcade`, or narrow
their public props to locally owned view data. Do not create a generalized
domain model solely to keep them under `shared`.

**Related Cleanup Ticket:** EPIC-05 shared ownership cleanup ticket to be
assigned.

---

### Finding 7: Generic HTTP utilities are owned by authentication

**Category:** File Ownership

**Priority:** Medium

**Status:** Confirmed

**Location:** `src/server/auth/utils/jsonResponse.ts`,
`src/server/auth/utils/requestFields.ts`, consumers in `src/server/apiRouter.ts`,
`src/server/profile`, and `src/server/admin`

**Current State:** Generic JSON response and request-field helpers live below
authentication but are used by unrelated server features and the top-level
router.

**Problem:** The directory communicates the wrong ownership and makes sibling
features depend on auth for generic HTTP mechanics.

**Expected Architecture:** Cross-feature HTTP utilities belong to a small
server-owned HTTP module; feature-specific validation should remain with its
feature.

**Recommended Action:** Move only genuinely generic helpers to a server HTTP
location and keep narrow helpers local.

**Related Cleanup Ticket:** EPIC-05 server ownership cleanup ticket to be
assigned.

---

### Finding 8: The user repository has cross-feature behavior but auth ownership

**Category:** File Ownership

**Priority:** Medium

**Status:** Confirmed

**Location:** `src/server/auth/prismaUserRepository.ts`, consumers in auth,
profile, password change, bootstrap, and application composition

**Current State:** `PrismaUserRepository` implements user operations required by
multiple features but lives directly under authentication. Admin user behavior
has a separate Prisma adapter.

**Problem:** Persistence ownership does not match the implemented user aggregate
and makes profile behavior depend on an auth-owned adapter. It is unclear which
adapter should gain future user operations.

**Expected Architecture:** Cross-feature user persistence should have explicit
server/user or persistence ownership, while feature contracts remain narrow.

**Recommended Action:** Decide ownership before moving code. Prefer relocating
or simplifying the existing adapter over adding another repository layer.

**Related Cleanup Ticket:** EPIC-05 backend/user ownership cleanup ticket to be
assigned.

---

### Finding 9: Page CSS duplicates missing shared layout and feedback patterns

**Category:** Duplication

**Priority:** Medium

**Status:** Confirmed

**Location:** `src/arcade/auth/AuthPage.css`,
`src/arcade/account/AccountPage.css`, `src/styles.css`, corresponding page
components

**Current State:** Auth and account pages separately define the same grid page
layout, reading-width card, form gap, error surface, action alignment, and
phone behavior. `src/styles.css` also defines a local `.game-page` grid despite
the shared page/container system.

**Problem:** The repeated rules are application-level patterns already governed
by the design system. Page-local copies can drift and force every new form page
to recreate the same layout and feedback treatment.

**Expected Architecture:** Pages should compose `PageContainer`, shared form and
feedback components, and named layout variants. Truly feature-specific rules,
such as profile-image layout or the admin user grid, should remain local.

**Recommended Action:** Identify the repeated form-page primitives, add only the
smallest proven shared layout/variant, and remove duplicate page rules. Do not
collapse all component styles into one global stylesheet.

**Related Cleanup Ticket:** EPIC-05 shared UI composition cleanup ticket to be
assigned.

---

### Finding 10: Breakpoint values are duplicated outside the token layer

**Category:** Duplication

**Priority:** Low

**Status:** Needs Investigation

**Location:** `src/shared/ui/styles/tokens.css`, component CSS, and feature CSS

**Current State:** Tokens declare `--breakpoint-phone`,
`--breakpoint-tablet`, and `--breakpoint-desktop`, while stylesheets repeat
literal `520px` and `768px` media queries.

**Problem:** The documented centralized breakpoint source is not operational.
Standard CSS custom properties cannot be used directly in media-query
conditions, so the current token declarations do not prevent drift.

**Expected Architecture:** Breakpoint values should have one effective build-time
or authoring source, or the documentation should acknowledge the constrained
duplication and require synchronized values.

**Recommended Action:** Investigate Vite-compatible custom media/build tooling
or revise the token convention. Do not add tooling solely to remove a few
literals without weighing maintenance cost.

**Related Cleanup Ticket:** EPIC-05 design-token cleanup ticket to be assigned.

---

### Finding 11: `IconButton` duplicates `Button` behavior through CSS coupling

**Category:** Duplication

**Priority:** Medium

**Status:** Confirmed

**Location:** `src/shared/ui/components/IconButton/IconButton.tsx`,
`src/shared/ui/components/IconButton/IconButton.css`,
`src/shared/ui/components/Button/Button.tsx`

**Current State:** `IconButton` independently renders a button and loading
spinner, uses `Button` types and class names, and imports `Button.css` from its
own stylesheet.

**Problem:** Behavior and markup can drift from `Button`; stylesheet import order
becomes part of the component contract; and the supposed component boundary is
only partial.

**Expected Architecture:** `IconButton` should be a supported composition or
variant of the shared button implementation, with one source for common states
and accessibility behavior.

**Recommended Action:** Reuse a shared internal button primitive or implement an
explicit icon-only variant without duplicating state behavior.

**Related Cleanup Ticket:** EPIC-05 shared component consolidation ticket to be
assigned.

---

### Finding 12: `ArcadeApp` combines navigation and game orchestration

**Category:** Architecture

**Priority:** Medium

**Status:** Confirmed

**Location:** `src/arcade/ArcadeApp.tsx`

**Current State:** The composition root owns game lifecycle, fullscreen state,
five view-selection flags, identity actions, API-client construction, header
selection, notifications, and all page composition.

**Problem:** Every new application page or global workflow changes the same
component. Mutually exclusive view flags and reset operations are spread across
callbacks, increasing the chance of invalid combinations as the shell grows.

**Expected Architecture:** The root should compose navigation, identity, and
game-host concerns through explicit boundaries. Splitting should follow actual
cohesion and should not introduce a state framework without need.

**Recommended Action:** Address navigation first, then extract only stable
orchestration units demonstrated by the resulting component. Preserve
`GameManager` as the single game lifecycle owner.

**Related Cleanup Ticket:** EPIC-05 arcade shell cleanup ticket to be assigned.

---

### Finding 13: Backend handlers are not proven redundant with framework actions

**Category:** Other

**Priority:** Low

**Status:** Confirmed

**Location:** `src/server/apiRouter.ts`, server handlers, `package.json`

**Current State:** A small custom router maps HTTP methods and paths to handlers.
Handlers perform request parsing, authorization, validation, service calls, and
response mapping.

**Problem:** The router and handlers are sometimes described as unnecessary
because Remix provides route `action` and `loader` functions. Remix is not
installed, and React/Vite provide no equivalent server request lifecycle.
Treating these files as duplicate built-ins would lead to removal of required
security and transport boundaries.

**Expected Architecture:** Under the current stack, retain a server routing and
request-handling boundary, while simplifying its internal file organization.
Under a future Remix migration, loaders/actions could become transport adapters,
but validation, authorization, services, and persistence would still exist.

**Recommended Action:** No removal under issue #87. Evaluate framework migration
separately; consolidate endpoint files only where Finding 4 demonstrates weak
boundaries.

**Related Cleanup Ticket:** None until an architecture decision is approved.

## Why the structure likely developed this way

The repository cannot prove what an LLM “thought,” so intent is not presented as
fact. The implementation and commit history support a narrower explanation:

1. Work arrived as small endpoint-focused tickets. Each ticket added a handler,
   validation, types, errors, tests, and exports without a later cohesion pass.
2. “Single responsibility” was applied mechanically as one concern or function
   per file. That optimizes local generation and testing but not feature-level
   comprehension.
3. The data-driven testing rule encouraged pure exported helpers, which is
   useful, but their exportability was also treated as a reason for separate
   production files.
4. The design-system rule correctly encouraged component ownership, but repeated
   page compositions were not promoted after genuine reuse became visible.
5. The original React/Vite choice predates the present server surface. Server
   functionality was added incrementally rather than through a recorded
   full-stack framework decision.

These are process and boundary issues, not evidence that every short file,
handler, or stylesheet is wrong.

## Prioritized cleanup sequence

1. **High:** confirm and remove duplicate API composition roots.
2. **High:** correct the `shared/ui` to `arcade` dependency direction.
3. **Medium:** define cohesive server feature boundaries and reduce barrels.
4. **Medium:** correct generic HTTP and user-persistence ownership.
5. **Medium:** consolidate proven shared page layout/feedback patterns and the
   button implementation.
6. **Medium:** decide whether browser URL routing is a product requirement.
7. **Low:** resolve the breakpoint-token convention.
8. **Separate architecture decision:** consider Remix or another full-stack
   framework only if its migration cost and desired routing/runtime model are
   explicitly approved.

## Confirmed healthy boundaries

To keep cleanup focused, the audit also found boundaries that should not be
removed merely to reduce file count:

- `GameManager` owns one long-lived Phaser runtime and the single-active-game
  invariant.
- `GameRegistry` dynamically loads the only current game.
- the game does not import another game, and React does not own Phaser gameplay.
- server-side authorization and valuable Dino Coin mutations remain on the
  server.
- component-local CSS is a valid ownership mechanism; only demonstrated
  duplication or misplaced rules should be consolidated.
- handlers, services, and persistence adapters represent real security and
  dependency boundaries even if some adjacent files should be merged.

## Open investigations

- Confirm the three partial API factories have no consumers outside this
  repository before deletion.
- Decide whether catalogue/auth/account/admin views require deep links and
  browser history.
- Record whether Vite SPA + Node remains the target stack.
- Map each finding to the numbered EPIC-05 cleanup sub-issue once those issue
  assignments are available.
- Use dependency tooling or a production build graph to verify unused exports
  before cleanup; text search alone is evidence, not a deletion guarantee.
