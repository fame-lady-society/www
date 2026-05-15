---
status: complete
priority: p2
issue_id: "017"
tags: [fame-swap, router, validation, solver, release-gate]
dependencies: []
---

# Add Fame Router Current Route Execution Gate

## Problem Statement

The contracts repo validates deployed FameRouter configuration and live pool metadata, but the production app owns the live resolver, quote-derived minimums, route materialization, and call simulation path. Release safety needs an app-side gate that proves the current production route universe still executes against Base before app routing or ownership/launch decisions depend on the router.

## Findings

- Origin contracts review: `.context/compound-engineering/ce-review/20260515-103118-codex-main-review/synthesis.md` in `fame-contracts`.
- Contracts finding: `ValidateFameRouterBase` checks router configuration and pool metadata but does not prove current route execution.
- The gate belongs in `../www` because this app has the production resolver and quote machinery.
- The gate should use the same materialization path as production: deployed router address, near-term deadline, quote-derived per-leg minimums, and final minimum.

## Proposed Solutions

### Option 1: Production Resolver Validation Command

**Approach:** Add a command or script that asks the Fame swap resolver for the launch-route universe, materializes routes for the deployed Base FameRouter, and simulates the exact router calls against Base RPC.

**Pros:**
- Exercises the production route path instead of duplicating solver logic in contracts.
- Proves route execution with current liquidity and quotes.
- Can run as a release gate through Doppler.

**Cons:**
- Requires live Base RPC and quote dependencies.
- Needs clear failure reporting so release operators know whether to stop, retry, or disable a route.

**Effort:** Medium.

**Risk:** Medium.

### Option 2: Route-Lab Release Mode

**Approach:** Extend the existing route-lab tooling with a release validation mode that materializes and simulates every launch route using production-safe deadlines and minimums.

**Pros:**
- Reuses existing route-lab evidence and reporting.
- Produces operator-friendly markdown output.

**Cons:**
- Route-lab must be kept aligned with the actual production resolver path.

**Effort:** Medium.

**Risk:** Medium.

## Recommended Action

Use the existing fork-smoke harness as the release gate instead of introducing a second validation path. The harness already reuses the production quote resolver and materialization code, simulates exact `executeRoute` calls, and reports route/pool/hash context on failure. Add an explicit package command that forces configured-router, all-corpus, latest-fork mode for release use.

## Technical Details

Affected areas likely include:

- `src/features/fame-swap/solver/**`
- `src/features/fame-swap/solver/materializeRoute.ts`
- `src/features/fame-swap/router/**`
- `scripts/fame-swap-route-lab.ts`
- release/checklist documentation

Validation requirements:

- Use the deployed Base FameRouter address: `0xAdefa5860389E8936ebf2977e1Fb4a365aA39636`.
- Use near-term deadlines.
- Use quote-derived per-leg and final minimums, not fork smoke-test one-wei minimums.
- Run through Doppler without printing RPC URLs, private keys, or API keys.

## Resources

- Contracts review synthesis: `../fame-contracts/.context/compound-engineering/ce-review/20260515-103118-codex-main-review/synthesis.md`
- Contracts deployed router: `0xAdefa5860389E8936ebf2977e1Fb4a365aA39636`
- Contracts materialization follow-up: `../fame-contracts/.context/compound-engineering/todos/016-pending-p2-extend-base-router-validation-to-current-route-execution.md`

## Acceptance Criteria

- [x] App-side validation command materializes current production FameRouter routes with near-term deadlines and quote-derived minimums.
- [x] Command simulates the exact router calls against Base RPC.
- [x] Failures identify the route, pool/venue, quote/minimum context, and whether the route should be disabled or retried.
- [x] Command runs through Doppler and does not print secrets.
- [x] Release docs/checklist name this command as the current-route execution gate.
- [x] Contracts validation remains limited to deployment config, manifest, fork evidence, and pool metadata.

## Work Log

### 2026-05-15 - Initial Todo

**By:** Codex

**Actions:**
- Created from `fame-contracts` review triage after deciding the current-route execution gate belongs in the production app, not the Solidity validation script.

**Learnings:**
- Static deployed-router validation and live route execution validation have different owners.
- The app is the right owner for current execution proof because it owns quote-derived minimums and production materialization.

### 2026-05-15 - Release Gate Wired To Fork Smoke Harness

**By:** Codex

**Actions:**
- Added `bun run fame-swap:release-gate`, which runs `fame-swap-fork-smoke` with `FAME_SWAP_USE_CONFIGURED_ROUTER=1`, `FAME_SWAP_FORK_CASES=all`, and `FAME_SWAP_FORK_BLOCK=latest`.
- Documented the deployed Base router release-gate command using `NEXT_PUBLIC_FAME_ROUTER_ADDRESS=0xAdefa5860389E8936ebf2977e1Fb4a365aA39636` through Doppler.
- Kept contracts validation ownership unchanged; the app gate owns current quote/materialization/simulation proof.

**Verification:**
- `bun test scripts/fame-swap-route-lab.test.ts src/features/fame-swap/solver/materializeRoute.test.ts src/features/fame-swap/solver/quote.test.ts src/features/fame-swap/solver/amountSolver.test.ts`
- Live `bun run fame-swap:release-gate` requires Base RPC secrets and should be run through Doppler before release.
