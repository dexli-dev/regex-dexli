# Contributing — regex.dexli.dev

This document is the source of truth for commit attribution. Bar item 12
requires ≥70% of non-trivial commits be attributable to named engineers (not
the CTO), verifiable mechanically from `git log` alone. The convention below
makes that bucketing one-pass.

## Roles

- **engine** — regex evaluation core, flag plumbing, invalid-pattern
  reporting, backtracking-safe abort/timeout, pattern library data + types,
  URL state runtime consumption. Owns `src/lib/engine.ts`,
  `src/lib/patterns.ts`, and any other backend-style logic. No DOM access.
- **frontend** — page composition, controls, match-view rendering,
  highlighting, mobile layout, copy-URL affordance. Owns `src/routes/+page.svelte`
  and any UI components under `src/lib/components/` other than `Wordmark.svelte`.
- **scaffold** — CTO-only. Brand artifacts (`Wordmark.svelte`), palette
  (`app.css`), fonts (`fonts.css`), CSP/security headers
  (`svelte.config.js`, `hooks.server.ts`), URL state contract types
  (`src/lib/url-state.ts`), Dockerfile, deploy config, family footer.

## Commit convention

**Subject prefix (primary signal):**

```
feat(engine): live-match runs through new-pattern path
fix(engine): catastrophic-backtracking abort fires inside 1s
test(engine): empty-pattern returns zero-matches state
feat(frontend): two-pane match view with copy-on-click rows
fix(frontend): mobile reflow no longer occludes flag toggles at 375px
test(frontend): edge-case states render without unhandled errors
feat(scaffold): Dockerfile + Dokploy autodeploy
chore(infra): Dokploy compose updates
chore(brand): family footer adds new sibling
```

**Body trailer (unambiguous backup; REQUIRED on every non-trivial commit):**

```
Engineer: engine
```

Allowed values: `engine`, `frontend`, `scaffold`.

A commit's bucket is determined by:

1. Read the subject's parenthesised tag. If it's `engine`, `frontend`, or
   `scaffold`, that's the bucket.
2. If the subject lacks a recognised tag, read the body for an
   `Engineer:` line. The value is the bucket.
3. If both are missing, the commit is unattributable and counts against
   the eval ratio (assume CTO).

## Trivial-exclusion list

Excluded from the bar-item-12 ratio denominator. Use these subject prefixes
freely without an Engineer trailer:

- `chore(deps): …`  — dependency bumps from package manager
- `chore(lockfile): …`  — lockfile-only updates
- `style: …`  — whitespace / formatting / lint
- `chore(version): …`  — version stamps

## Workflow

1. Engineers work in git worktrees off of `master`.
2. Branch name: `engine/<short-slug>` or `frontend/<short-slug>`.
3. Open a small PR (or push directly if CTO has approved direct-to-master
   for trivial slices) — CTO reviews and merges.
4. CTO commits cycle through `feat(scaffold)`, `chore(brand)`, etc. with
   `Engineer: scaffold` trailer.

## Forbidden patterns

- Do not paste literal forbidden-string grep commands into commit bodies.
  The pattern text becomes a tree-history hit on its own future scan.
  (Twice-caught across prior ventures — banked in team memory.)
- Do not absorb engineer-domain code into scaffold commits to "make
  progress faster." The five absorption-rationalization phrases —
  *small / surgical / my-spec-bug / eval-window / structural-clarity* —
  all map to CTO traps that defeat the multi-actor org pattern.
