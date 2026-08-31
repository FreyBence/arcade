# Version Control Guide

Follow these rules for all branch, commit, merge, and cleanup operations.

## Temp

- temporarly Branch management rules should be ignored
- work should be done on master
- Commit management rules should be applied

## Branch management

- For work tied to a GitHub issue, create the branch from the latest default branch and link it to the issue in GitHub's Development section. Prefer GitHub's linked-branch operation when authenticated access is available.
- Name issue branches `issue-<issue-number>/<branch-name>` unless the issue or user specifies another name.
- Branch names must not contain whitespace. Use a short kebab-case description for `<branch-name>`.
- Publish every new issue branch immediately, before making implementation commits. Configure its upstream with `git push -u origin <branch>` when the branch was created locally.
- If authenticated GitHub access for creating the issue link is unavailable, still create and publish the branch, then explicitly report that the Development link could not be established automatically.
- Pull requests are optional. When working without one, update the local default branch and merge completed work with `git merge --ff-only <branch>` whenever the history permits.
- After a successful merge and push, switch to the default branch, delete the merged local branch with `git branch -d <branch>`, delete its remote branch, and run `git fetch --prune` to remove stale remote-tracking references.
- Never force-delete an unmerged branch. Confirm the default branch contains the branch tip and that the working tree is clean before cleanup.

## Commit management

- For work tied to a GitHub issue, format each commit message as `issue-<issue-number>: <commit-message>`.
- For commit creation check if the uncommited changes should be separated into more commits.
