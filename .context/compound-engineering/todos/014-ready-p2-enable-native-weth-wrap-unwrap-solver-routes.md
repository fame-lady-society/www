---
status: ready
priority: p2
issue_id: "014"
tags: [fame-swap, router, native-eth, weth, solver]
dependencies: []
---

# Enable Native WETH Wrap/Unwrap Solver Routes

Teach the app-side Fame swap solver to use the newly deployed router support for native ETH <-> WETH route legs, then lift the current native/WETH route restrictions only after route materialization matches the contract schema.

## Problem Statement

The contracts now support explicit native wrap/unwrap route legs through the FameRouter `NativeWrap` venue family. The app solver should stop treating ETH/WETH conversion as an unavailable pool gap and should instead emit deterministic wrap/unwrap legs when a valid route needs to cross the native ETH/WETH boundary.

Deployed Base FameRouter with NativeWrap code:

- `0x6278cf08640dE3b5F1e108bfE0630E153aB2503E`
- Basescan: `https://basescan.org/address/0x6278cf08640de3b5f1e108bfe0630e153ab2503e`
- Contract implementation commit: `1176009 feat(router): add native WETH route legs`
- Contract deployment commit: `057a04c chore(router): deploy NativeWrap allowlisted router`

## Findings

- Contract `VenueFamily.NativeWrap` ordinal is `6`.
- Valid wrap direction is native ETH to canonical Base WETH.
- Valid unwrap direction is canonical Base WETH to native ETH.
- Canonical Base WETH target is `0x4200000000000000000000000000000000000006`.
- NativeWrap legs require empty payload data: `data = "0x"`.
- NativeWrap legs do not consume calldata for slippage protection: `minAmountOut = "0"`.
- `ExactIn` NativeWrap legs use explicit `amount`/`amountIn`; `All` NativeWrap legs use `amount = "0"` as the existing all-balance sentinel.
- Contract-side generated proof routes include `solver-eth-weth-fame` and `solver-fame-weth-eth`.
- Contract-side router-ts marks route capability with `capabilities.nativeWrap = true`.
- Production deployments now enable NativeWrap through the contract launch manifest. Verify the active router has the NativeWrap family and canonical WETH target enabled before exposing public native routes.

## Recommended Action

Add NativeWrap as a deterministic primitive edge in the app solver. Do not model it as a fake pool. It has no price impact, no quoter, and a strict contract encoding surface.

Keep the implementation lean:

- add the schema ordinal and route materialization support,
- add graph edges for ETH -> WETH and WETH -> ETH,
- add tests for the exact encoded leg payloads,
- keep public quote output concise,
- use route-lab/debug surfaces for capability and materialization evidence.

## Technical Details

Likely affected areas:

- Fame swap router schema/types
- solver graph edge construction
- route candidate materialization
- `buildLegPayload` or equivalent contract payload builder
- route-lab/debug output for reviewed/disabled native wrap edges
- app config for the Base FameRouter address

Contract encoding facts to mirror:

- `venueFamily = 6`
- `target = 0x4200000000000000000000000000000000000006`
- `data = 0x`
- `minAmountOut = 0`
- explicit amount for exact-input wrap/unwrap
- amount `0` only for all-balance NativeWrap legs

## Acceptance Criteria

- [ ] App config uses Base FameRouter `0x6278cf08640dE3b5F1e108bfE0630E153aB2503E` for routes that need NativeWrap support.
- [ ] Solver schema includes `NativeWrap = 6` and stays ordinal-compatible with the deployed contract.
- [ ] Solver adds deterministic ETH -> WETH and WETH -> ETH primitive edges instead of fake pools.
- [ ] Route materialization emits NativeWrap legs with empty `data` and zero `minAmountOut`.
- [ ] Exact-input NativeWrap routes set only the required input amount; all-balance NativeWrap routes use the existing zero amount sentinel only where the router expects `All` mode.
- [ ] Native/WETH restrictions are lifted only after materialized routes pass app tests and deployed-router simulation.
- [ ] UI/debug output distinguishes native ETH, WETH, and NativeWrap route legs clearly.
- [ ] Route-lab includes at least one ETH -> WETH -> FAME example and one FAME -> WETH -> ETH example against current Base configuration.
- [ ] Public route responses avoid verbose internal proof artifacts unless an explicit debug surface requests them.

## Resources

- Contract plan: `../fame-contracts/docs/plans/2026-05-14-001-feat-native-weth-route-legs-plan.md`
- Contract docs: `../fame-contracts/docs/router/fame-router-schema.md`
- Contract docs: `../fame-contracts/docs/router/fame-router-validation.md`
- Contract generated route proofs: `../fame-contracts/router-ts/src/generated/routes.ts`
- Contract implementation commit: `../fame-contracts` commit `1176009`

## Work Log

### 2026-05-14 - Created From Contract Deployment

**By:** Codex

**Actions:**
- Created this app-side todo after deploying the contract-side NativeWrap implementation on Base.
- Captured the deployed router address and exact contract encoding constraints needed by the app solver.

**Learnings:**
- The app should treat NativeWrap as a deterministic operation edge, not a liquidity venue.
- The deployed contract should expose NativeWrap through the same manifest-configured venue gates as swap venues; public native routes still need a live validation/config check before enablement.
