# Mobile Arcade Application UI Design System

This is the baseline specification for the shared Mobile Arcade application shell and other React-owned application UI. It extends the ownership rules in `docs/architecture.md` and provides the shared UI foundation for catalogue, authentication, profile, account, settings, progress, and game-host surfaces.

The central principle is: **the Mobile Arcade application must look coherent without forcing every game to look the same.**

## Scope and ownership

The shared application design system owns:

- The application shell, page background, global header, and navigation.
- The game catalogue and game cards.
- Authentication, profile, account, and settings screens.
- Application dialogs, confirmations, notifications, and feedback states.
- Game loading and error states.
- The game viewport container and fullscreen controls.
- Other React-owned, non-game pages.

Each game owns:

- Its HUD, score presentation, menus, controls, boards, tiles, pieces, and game objects.
- Game-specific dialogs, typography, iconography, animation, and visual effects.
- Its internal visual theme.

A game may deliberately look completely different from the arcade shell. This is an intentional product boundary. Game-specific UI is not required to follow this design system unless it explicitly reuses an application-level component.

## Design principles

- **Pocket arcade identity:** The shell is dark, compact, mobile-first, clean, and slightly futuristic without becoming heavily neon, cyberpunk, or visually noisy.
- **Hierarchy before decoration:** Contrast, typography, spacing, and layout establish hierarchy. Glow, transparency, and motion only support it.
- **Indigo as an accent:** Indigo identifies selected states, primary actions, focus, important icons, and controlled emphasis. Large surfaces remain navy.
- **Reuse before customization:** Application pages compose shared components. Local implementations are allowed only when no shared abstraction is appropriate.
- **Semantic styling:** Components consume semantic design tokens instead of hard-coded theme values.
- **Explicit variants:** Reusable visual differences use named component variants instead of page-specific CSS overrides.
- **Intentional exceptions:** Rules may be broken only for a concrete functional, responsive, accessibility, platform, or game-ownership reason.
- **Mobile first:** Every shared component must work from a 320 px viewport upward, with touch as a first-class interaction model.

## Design tokens

All shared UI styling derives from centralized design tokens. Theme primitives such as colors, standard radii, spacing, breakpoints, typography roles, and motion durations are defined only in the token layer.

### Color

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Background base | `--color-bg-base` | `#101522` | Primary page background |
| Background glow | `--color-bg-glow` | `#293e78` | Radial indigo-blue atmosphere near the top |
| Surface default | `--color-surface-default` | `#17213d` | Cards and elevated application surfaces |
| Surface hover | `--color-surface-hover` | `#202d52` | Hover and interactive surface state |
| Text primary | `--color-text-primary` | `#f8fafc` | Headings, values, and primary labels |
| Text secondary | `--color-text-secondary` | `#cbd5e1` | Descriptions and supporting copy |
| Text accent | `--color-text-accent` | `#a5b4fc` | Eyebrows and selective emphasis |
| Accent primary | `--color-accent-primary` | `#818cf8` | Primary interaction and focus accent |

Borders use semantic translucent-white tokens:

```css
--color-border-subtle: rgba(255, 255, 255, 0.08);
--color-border-default: rgba(255, 255, 255, 0.12);
--color-border-strong: rgba(255, 255, 255, 0.20);
```

### Typography

The shared application font stack is Inter followed by system sans-serif fonts. Games are not required to use it.

| Role | Baseline | Usage |
| --- | --- | --- |
| Brand | `1.2rem`, weight 800 | Brand and home action |
| Display | `clamp(2.3rem, responsive, 4.6rem)`, weight 800 | Catalogue and major introductions |
| Page title | `2rem`, weight 700-800 | Application page and active-game headings |
| Section title | Shared smaller heading role | Secondary sections |
| Body large | `1.1rem`, line-height 1.6 | Introductions with a 600 px maximum reading width |
| Body | Shared default role | General application copy |
| Small | Shared compact role | Metadata and compact controls |
| Eyebrow | `0.8rem`, weight 700, uppercase, wide tracking | Page and section context |

### Spacing

Use a compact 4 px and 8 px-derived rhythm. Components must not introduce arbitrary spacing when a token is available.

```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
--space-16: 4rem;
--space-20: 5rem;
--space-24: 6rem;
--space-28: 7rem;
```

### Radius

| Token | Value | Usage |
| --- | --- | --- |
| `--radius-sm` | `8px` | Buttons and compact controls |
| `--radius-md` | `12px` | Icon surfaces and medium components |
| `--radius-lg` | `16px` | Cards and major containers |
| `--radius-full` | `9999px` | Pills and circular treatments |

### Motion

| Token | Duration | Usage |
| --- | --- | --- |
| `--motion-fast` | `150ms` | Buttons, hover states, and small responses |
| `--motion-standard` | `200ms` | Normal UI transitions |
| `--motion-slow` | `300ms` | Larger entrance or exit transitions when justified |

Shared motion must respect `prefers-reduced-motion`. Remove or substantially reduce non-essential transformations and transitions in reduced-motion mode.

## Application layout

### AppShell

`AppShell` owns the application background, radial glow, header, main content region, responsive gutters, safe-area handling, and global overlay host. Pages must not recreate the application shell.

### PageContainer

The standard content container is centered with a maximum width of 1040 px. Horizontal spacing uses a shared responsive gutter:

```css
--page-gutter: clamp(1rem, 5vw, 3.25rem);
```

`PageContainer` exposes named spacing variants such as `hero` and `standard`. Hero pages may use approximately 3-7 rem responsive vertical spacing; normal application pages use the more compact standard variant.

```tsx
<PageContainer spacing="hero">...</PageContainer>
<PageContainer spacing="standard">...</PageContainer>
```

## Header

All normal application pages use the shared `AppHeader`.

| Property | Rule |
| --- | --- |
| Height | 72 px fixed visual height |
| Left content | Mobile Arcade brand, functioning as the home action |
| Right content | Context-dependent actions such as profile, settings, sign in, or exit game |
| Horizontal spacing | Shared page gutter |
| Surface | Background-integrated transparent navy treatment |
| Divider | Thin translucent bottom border |
| Visual weight | Lightweight, with no heavy shadow |

## Buttons and controls

All application buttons use the shared `Button`. Required variants are `primary`, `secondary`, `ghost`, and `danger`; supported sizes may be `small`, `medium`, and `large`. Icon-only controls use `IconButton`.

Every interactive control explicitly supports default, hover, `focus-visible`, active or pressed, disabled, and loading states where loading is meaningful. Normal buttons use `--radius-sm`. Pages must not create a new button style for different text or slightly different emphasis.

```tsx
<Button variant="primary">Continue</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost">Exit game</Button>
<Button variant="danger">Delete</Button>
```

## Cards and catalogue

### Card

`Card` defines the standard application surface: default surface background, subtle translucent border, 16 px radius, and token-based internal spacing. Interactive cards receive hover, focus, and pointer states. Static cards must not move on hover.

### GameCard

The catalogue uses `GameCard`, which accepts game metadata instead of page-specific markup.

```tsx
<GameCard
  icon={game.icon}
  title={game.title}
  description={game.description}
  onSelect={onSelect}
/>
```

| Property | Rule |
| --- | --- |
| Layout | Icon tile, title and description, navigation indicator |
| Minimum target width | 270 px on tablet and desktop |
| Padding | `1.25rem` |
| Radius | `16px` |
| Grid gap | `1rem` |
| Hover motion | Translate upward by 3 px |
| Hover surface | `--color-surface-hover` |
| Hover duration | `150ms` |
| Touch behavior | Must not depend on hover to communicate interactivity |

### IconTile

`IconTile` provides the standard application and catalogue icon surface. The default game-card variant is 50 by 50 px, uses a 12 px radius, an approximately 1.5 rem icon, and the application accent. Future color differences must be semantic variants rather than arbitrary custom colors.

## Page introduction

Major pages compose `PageIntro` instead of recreating eyebrow, title, description, and spacing locally.

```tsx
<PageIntro
  eyebrow="Choose a game"
  title="Your pocket arcade"
  description="..."
/>
```

Introductory copy should not exceed approximately 600 px in comfortable reading width.

## Game host UI

The application-owned UI around a running game is standardized even though the game content is not. The shared layer provides `GamePageHeader`, `GameViewport`, `FullscreenButton`, `GameLoadingState`, and `GameErrorState`.

`GamePageHeader` displays application-level game identity: icon, title, and optional application-owned status. Internal game HUD information does not belong there.

In normal mode, `GameViewport` has a 16:9 aspect ratio, a maximum width of 1040 px, 16 px radius, hidden overflow, a subtle translucent border, and a navy background. It hosts the Phaser canvas while its outer styling remains application-owned.

## Fullscreen

Fullscreen is an explicit design-system exception because the interaction context changes. The viewport fills the screen, removes its border and radius, drops the normal aspect-ratio restriction, and respects safe-area insets.

| Property | Fullscreen rule |
| --- | --- |
| Width | `100vw` |
| Height | `100vh` |
| Border | None |
| Border radius | `0` |
| Aspect-ratio constraint | Removed |
| Safe area | Respect environment safe-area insets |

The fullscreen control remains application-owned even when it overlays a game. It uses a mostly opaque navy surface so it remains legible over arbitrary game visuals.

## Responsive rules

The application supports widths down to 320 px and is mobile-first. Centralize and minimize breakpoints; prefer components that respond naturally to available space.

```css
--breakpoint-phone: 520px;
--breakpoint-tablet: 768px;
--breakpoint-desktop: 1024px;
```

The catalogue uses an auto-fitting grid that naturally collapses to one column:

```css
grid-template-columns: repeat(auto-fit, minmax(min(100%, 270px), 1fr));
```

Below the phone breakpoint, the effective horizontal gutter is approximately 1 rem. Text actions may become accessible icon-only controls when space requires it, but touch targets remain compliant.

## Accessibility

Shared application UI targets WCAG AA behavior. Accessibility requirements are part of the component contract:

- Primary and secondary text maintain sufficient contrast on intended surfaces.
- Interactive touch targets provide at least 44 by 44 CSS pixels of hit area.
- All application navigation and controls are keyboard accessible.
- `focus-visible` uses a strong, consistent design-system indicator.
- Interactive elements use semantic HTML; clickable cards are real buttons or links.
- Icon-only controls have accessible labels.
- Loading, error, and disabled states remain understandable without relying on color alone.
- Non-essential motion respects reduced-motion preferences.

## Forms

Authentication, profile, account, and settings pages use shared form primitives. The initial set is `Input`, `PasswordInput`, `Label`, `FieldMessage`, and `FormField`; later additions may include `Select`, `Switch`, `RadioGroup`, and `Checkbox`.

Forms share typography, spacing, focus treatment, validation and error styling, disabled behavior, and field-state semantics. Pages must not build isolated form styles.

## Dialogs, overlays, and feedback

Application-level confirmation flows use a shared `Dialog`, including sign out, guest-progress merge, destructive account actions, and general confirmations. `Dialog` owns the backdrop, surface, title and body spacing, action layout, keyboard handling, focus trapping, and Escape behavior where appropriate. Game-specific dialogs may remain game-owned.

The shared system also provides consistent `LoadingState`, `EmptyState`, `ErrorState`, and `Toast` patterns. Pages must not invent unique error boxes or loading messages when a shared state component fits.

## Component architecture

Recommended organization:

```text
src/
  arcade/
    ArcadeApp.tsx
    GameManager.ts
    GameRegistry.ts
  shared/
    ui/
      components/
        Button/
        IconButton/
        Card/
        IconTile/
        AppHeader/
        PageContainer/
        PageIntro/
        GameCard/
        GameViewport/
        Dialog/
        Input/
      styles/
        tokens.css
        typography.css
        globals.css
        motion.css
      index.ts
  games/
    <game-id>/
```

Game styling remains in its game module. The shared UI directory must not become a dumping ground for styles used only once.

## CSS ownership

Required:

- Global theme tokens live in the shared design-system layer.
- Shared components own their styles.
- Pages compose shared components instead of reproducing their internals.
- Game CSS stays inside the corresponding game module.
- Shared responsive values are centralized.

Prohibited:

- Hard-coded theme colors outside token definitions.
- Page-local copies of shared buttons, cards, or headers.
- Arbitrary global CSS for a single page.
- Styling another component's internals from a page.
- Normal use of `!important` to defeat the design system.
- Page-local visual overrides when a named reusable variant is appropriate.

Shared UI code describes semantic roles rather than repeating visual literals. If an element is a standard application card, use `Card` instead of reproducing even token-based card CSS locally.

## Component variants

Visual differences that belong to a reusable concept become named variants:

```tsx
<Button variant="primary" />
<Button variant="secondary" />
<Button variant="ghost" />
```

Avoid page-specific classes such as `special-login-button`. Named variants make differences explicit, testable, and reusable. Repeated page-local overrides signal that the system may be missing a token, component, or variant.

## Exception policy

A design-system rule may be intentionally broken when at least one condition applies:

1. It represents a fundamentally different interaction context.
2. Accessibility requires it.
3. Platform or browser behavior requires it.
4. It belongs to game-owned UI.
5. The system does not yet represent a genuinely reusable requirement.

Exceptions remain local and must not silently mutate the global system. Repeated exceptions must be reviewed as candidates for a token, component, or named variant.

Initial intentional exceptions are the fullscreen game viewport, independently themed game UI, and responsive structural transformations such as replacing a text action with an accessible icon action.

## Governance

Use this decision order for new application UI:

1. Can an existing shared component solve the requirement?
2. Can an existing component variant solve it?
3. Is the requirement genuinely reusable across application UI?
4. If yes, add or extend a shared component or variant.
5. If no, allow a scoped local exception.

Do not create a shared component merely because an element appears once. Do not copy styling merely because creating the right reusable abstraction takes more effort.

## Strict implementation rules

- **UI-01:** No hard-coded theme colors outside token definitions.
- **UI-02:** No arbitrary font sizes when an existing typography role fits.
- **UI-03:** No arbitrary border radii when an existing radius token fits.
- **UI-04:** No duplicated button implementations.
- **UI-05:** No duplicated card-surface implementations.
- **UI-06:** Every interactive shared component supports keyboard use and visible focus.
- **UI-07:** Touch-critical controls meet minimum touch-target requirements.
- **UI-08:** Shared motion respects reduced-motion preferences.
- **UI-09:** Application pages use the shared shell and container system.
- **UI-10:** Game UI is not promoted into the global system without genuine application-level reuse.
- **UI-11:** Application UI does not depend on a particular game's visual theme.
- **UI-12:** Reusable intentional visual differences use named variants.
- **UI-13:** Repeated local overrides trigger design-system review.
- **UI-14:** Fullscreen behavior belongs to the shared game-host layer, not individual games.
- **UI-15:** Shared UI remains functional from 320 px through desktop widths.

## Initial shared component set

| Area | Components |
| --- | --- |
| Shell and layout | `AppShell`, `AppHeader`, `PageContainer`, `PageIntro` |
| Actions | `Button`, `IconButton` |
| Surfaces | `Card`, `IconTile`, `GameCard` |
| Game host | `GamePageHeader`, `GameViewport`, `FullscreenButton` |
| Forms | `FormField`, `Label`, `Input`, `PasswordInput`, `Checkbox`, `FieldMessage` |
| Overlays | `Dialog` |
| Feedback | `LoadingState`, `EmptyState`, `ErrorState`, `Toast` |

This vocabulary is introduced incrementally as corresponding application surfaces are built; not every component must exist immediately.

## Target theme identity

| Dimension | Target |
| --- | --- |
| Background | Deep navy with a restrained indigo radial glow |
| Surfaces | Dark navy cards with subtle translucent borders |
| Accent | Selective indigo for interaction and emphasis |
| Typography | Bright, high-contrast Inter with strong headings and restrained supporting text |
| Shape | Moderately rounded, not pill-heavy |
| Motion | Short, lightweight, and responsive |
| Density | Compact but touch-friendly |
| Personality | Modern pocket arcade rather than cyberpunk or neon arcade |

## Baseline acceptance criteria

- A centralized token file contains canonical application colors, spacing, radii, typography roles, breakpoints, and motion durations.
- Application pages do not hard-code theme colors.
- `AppShell`, `AppHeader`, `PageContainer`, `Button`, `Card`, `GameCard`, `GameViewport`, and `FullscreenButton` have clear shared ownership.
- The catalogue can use `PageIntro` and `GameCard` without page-local card styling.
- Fullscreen is a `GameViewport` or shared-host variant rather than a game-specific override.
- Account and authentication UI can use shared form, button, dialog, and feedback primitives.
- Keyboard focus, touch targets, semantic HTML, and reduced motion are component requirements.
- Games may define internal UI without importing application presentation components unless integration genuinely requires it.
- Recurring local visual overrides are reviewed for promotion to a token, component, or named variant.

## Decision status

This document is the baseline UI specification for the Mobile Arcade shared application shell. Future application UI work is evaluated against it. The theme may evolve through centralized tokens and component variants, while ownership boundaries, semantic styling, accessibility requirements, and the exception policy remain stable unless explicitly revised.
