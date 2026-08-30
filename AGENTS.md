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
- Run `npm run lint` and `npm run build` after implementation when Node.js is available.

## Branch management

- For work tied to a GitHub issue, create the branch from the latest default branch and link it to the issue in GitHub's Development section. Prefer GitHub's linked-branch operation when authenticated access is available.
- Name issue branches `<issue-number>-<short-kebab-case-description>` unless the issue or user specifies another name.
- Publish every new issue branch immediately, before making implementation commits. Configure its upstream with `git push -u origin <branch>` when the branch was created locally.
- If authenticated GitHub access for creating the issue link is unavailable, still create and publish the branch, then explicitly report that the Development link could not be established automatically.
- Pull requests are optional. When working without one, update the local default branch and merge completed work with `git merge --ff-only <branch>` whenever the history permits.
- After a successful merge and push, switch to the default branch, delete the merged local branch with `git branch -d <branch>`, delete its remote branch, and run `git fetch --prune` to remove stale remote-tracking references.
- Never force-delete an unmerged branch. Confirm the default branch contains the branch tip and that the working tree is clean before cleanup.
