---
status: complete
priority: p2
issue_id: "010"
tags: [fame-swap, maintainability, wagmi, config]
dependencies: ["008"]
---

# Simplify Quote Pipeline And Config Sources

## Problem Statement

The quoter now has both sync and async solver pipelines with similar route selection, status mapping, fee projection, and route materialization. The feature also keeps a default router address outside the generated wagmi address source. These are not immediate safety blockers, but they increase the chance of drift in code that decides whether a quote is executable.

## Findings

- Review found `quoteFameSwap` and `quoteFameSwapAsync` repeat validation, readiness handling, solved-status mapping, approval/call value construction, and ready quote projection.
- Review found sync and async ranking repeat route-local balance traversal, fee math, sorting, and warnings with `await` as the main difference.
- Project standards review found the Fame router default address is duplicated instead of sourced from generated `src/wagmi/index.ts` address data with environment overrides layered on top.

## Proposed Solutions

### Option 1: Async Pipeline As The Single Implementation

**Approach:** Make async ranking/solving the canonical implementation and adapt deterministic or recorded-state tests through an async wrapper.

**Pros:**

- Removes quote-path drift.
- Matches production live quote requirements.

**Cons:**

- Touches many solver tests and may be a larger refactor.

**Effort:** 1 day

**Risk:** Medium

### Option 2: Shared Internal Helpers

**Approach:** Factor shared validation, status projection, fee/warning construction, and route materialization into small helpers used by both sync and async paths.

**Pros:**

- Lower-risk incremental cleanup.
- Preserves existing sync tests.

**Cons:**

- Still leaves two ranking entrypoints.

**Effort:** 4-8 hours

**Risk:** Low

### Option 3: Source Router Address From Wagmi Generation

**Approach:** Import the generated Fame router address map and use `fameRouterAddress[base.id]` as the default, keeping env overrides only for fork/local dev.

**Pros:**

- Aligns with project standards.
- Reduces deployment-address drift.

**Cons:**

- Needs tests around local fork override behavior.

**Effort:** 1-2 hours

**Risk:** Low

## Recommended Action

Use Option 2 first to reduce duplication without a broad solver rewrite, source the router address from generated wagmi data in the same cleanup pass, and defer Option 1 until after route-state coverage in todo `007` is settled.

## Acceptance Criteria

- [x] Shared helper coverage proves sync and async status mapping, fee projection, warnings, and materialization remain equivalent.
- [x] Production quote path still cannot return executable quotes from deterministic hard-cap profiles.
- [x] Default Fame router address comes from generated wagmi address data, with documented env override only for fork/local development.
- [x] Existing route lab, API, and focused solver tests pass after cleanup.

## Work Log

### 2026-05-14 - Triage

**By:** Codex

**Actions:**

- Created from maintainability and project-standards review findings.

**Learnings:**

- The code is functionally safer after the P1 fixes, but the next cleanup should reduce duplication before adding more protocol-specific state outputs.

### 2026-05-14 - Completed Quote Pipeline And Config Cleanup

**By:** Codex

**Actions:**

- Extracted shared quote request preparation and solver-result projection so `quoteFameSwap` and `quoteFameSwapAsync` use one status/fee/warning/materialization mapping layer.
- Added sync/async quote equivalence tests across ready, unsupported, no-safe-route, and not-live-ready states, with non-ready states checked for lack of executable transaction fields.
- Sourced the default production Fame router address from generated wagmi address data and preserved the environment override for local and fork development.
- Added config tests covering generated default, valid override, and invalid override fallback.
- Reviewed the cleanup in `.context/compound-engineering/ce-review/20260514-010-quote-pipeline-config-codex/summary.md`; no P1/P2 findings.

**Verification:**

- `bun test src/features/fame-swap/config.test.ts src/features/fame-swap/solver/quote.test.ts`
- `bun test src/features/fame-swap/config.test.ts src/features/fame-swap/solver/quote.test.ts src/app/api/fame/swap/quote/route.test.ts scripts/fame-swap-route-lab.test.ts src/features/fame-swap/solver/amountSolver.test.ts src/features/fame-swap/solver/quotes/rankRoutes.test.ts`
- `yarn lint --file src/features/fame-swap/config.ts --file src/features/fame-swap/config.test.ts --file src/features/fame-swap/solver/quote.ts --file src/features/fame-swap/solver/quote.test.ts`
- `./node_modules/.bin/prettier --check src/features/fame-swap/config.ts src/features/fame-swap/config.test.ts src/features/fame-swap/solver/quote.ts src/features/fame-swap/solver/quote.test.ts docs/plans/2026-05-14-010-fame-swap-quote-pipeline-config-cleanup-plan.md`
- `git diff --check -- src/features/fame-swap/config.ts src/features/fame-swap/config.test.ts src/features/fame-swap/solver/quote.ts src/features/fame-swap/solver/quote.test.ts docs/plans/2026-05-14-010-fame-swap-quote-pipeline-config-cleanup-plan.md`
- `rg "as any|as unknown" src/features/fame-swap/config.ts src/features/fame-swap/config.test.ts src/features/fame-swap/solver/quote.ts src/features/fame-swap/solver/quote.test.ts`

**Learnings:**

- Keeping the sync and async solver entrypoints is workable when request preparation and quote projection are centralized.
- The generated wagmi address map is a better production source of truth for the Fame router address than a second hard-coded config value.
