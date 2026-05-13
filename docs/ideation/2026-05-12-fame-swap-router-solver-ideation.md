---
date: 2026-05-12
updated: 2026-05-13
topic: fame-swap-router-solver-www
focus: "Remaining solver, backend quote, artifact, fork, and verification work for FAME swap"
status: active
source_branch: feat/fame-swap-router-solver
split_ui_doc: docs/ideation/2026-05-13-fame-swap-widget-ui-ux-hardening-ideation.md
---

# Ideation: FAME Swap Router Solver Finish

## Purpose

This document is now the solver/backend half of the FAME swap ideation split. The original 2026-05-12 ideation covered both route solving and the first `/fame/swap` widget. Commit `6c07283 feat(fame-swap): enable live router swaps` implemented the first `www` slice: copied route artifacts, manifest metadata, ABI/hash parity checks, live readiness checks, arbitrary-amount route materialization, slippage-backed wallet simulation, transaction request generation, the first widget, and fork scripts.

The remaining question for this document is narrower: what solver, backend, artifact, fork, and verification work still matters before the router-backed swap flow is dependable enough to promote.

Widget presentation and interaction work moved to `docs/ideation/2026-05-13-fame-swap-widget-ui-ux-hardening-ideation.md`.

## Codebase Context

### Current `www` Implementation

- `src/features/fame-swap/artifacts/` contains copied Base v1 solver routes, gap matrix, parity vectors, and a TypeScript manifest.
- `src/features/fame-swap/router/` owns route typing, ABI encoding, route hashing, payload patching, minimal router ABI, and ERC-20 approval ABI.
- `src/features/fame-swap/solver/` owns artifact loading, integrity checks, quote construction, route materialization, live readiness, slippage math, and display formatting.
- `src/app/api/fame/swap/quote/route.ts` exposes a node runtime quote endpoint that validates request shape, reads live router policy, materializes routes, and returns approval/swap request data.
- `src/features/fame-swap/hooks/useFameSwapTransaction.ts` runs wallet-side probe simulation, computes a slippage-protected final minimum, simulates the exact protected route, then submits through wagmi.
- `scripts/fame-swap-fork-smoke.ts`, `scripts/fame-swap-fork.ts`, and `scripts/fame-swap-local-dev.ts` provide local fork, local router deployment, smoke validation, and local development loops.

### Recent Verification

Focused FAME swap tests passed on 2026-05-13:

- `bun test src/features/fame-swap/router/encodeRoute.test.ts src/features/fame-swap/solver/quote.test.ts src/features/fame-swap/solver/readiness.test.ts src/features/fame-swap/solver/materializeRoute.test.ts src/features/fame-swap/state.test.ts src/features/fame-swap/transactions.test.ts src/features/fame-swap/components/FameSwapWidget.test.ts`
- Result: 24 pass, 0 fail.

`yarn lint` also passed, with pre-existing warnings in `src/app/[network]/profile/image/[tokenId]/route.tsx` about raw `<img>` usage.

### Current Todo State

- `001` live slippage-backed FAME swap quotes: completed. The filename still contains `pending`, but front matter and acceptance criteria are checked.
- `002` pinned archive RPC validation: pending. Latest-state fork smoke has passed, but default manifest-block validation still needs an archive-capable RPC path.
- `003` typed FAME swap artifacts: pending. Runtime integrity checks exist, but JSON imports still rely on TypeScript assertions.

### What Can Be Checked Off From The Plan

- Unit 1 can be checked off for artifact copying, manifest metadata, route types, ABI encoding, route hash parity, and gap-matrix coverage. Typed artifact generation remains follow-up todo `003`.
- Unit 2 can be checked off. The implementation superseded exact-fixture-only matching with arbitrary positive input amounts materialized from pinned templates plus slippage-backed simulation.
- Unit 4 can be checked off for the transaction boundary. The remaining approve-then-submit polish is a frontend flow problem, not a missing request builder.
- Unit 5 is partial: the fork harness exists and latest-state validation is documented, but pinned archive RPC validation remains todo `002`.
- Unit 3 is partial from a solver perspective because the state machine exists, but the current widget still exposes solver facts as technical UI rather than product-grade swap UX.

## Raw Candidate Pool

The post-commit candidate pool was generated from four frames: user/operator pain, removal or automation of painful steps, assumption-breaking, and leverage on future work.

- Pinned archive RPC lane with a documented provider contract.
- Typed `.ts` artifact generator using `satisfies` declarations.
- Runtime schema parser for copied JSON artifacts.
- Artifact sync command from `../fame-contracts` with hash and source commit checks.
- Quote API response contract tests that mirror client transaction generation.
- Server-side quote freshness and route hash signing or checksum metadata.
- Multi-route search over the frozen pool graph instead of curated route IDs only.
- Route ranking that compares direct, split, merge, and multi-hop candidates.
- Per-leg quote/minimum policy beyond final post-fee protection.
- Venue-specific quote adapters for Solidly, Uniswap V2, Slipstream, V3, and V4.
- Fork simulation quote mode for routes that cannot be safely quoted with view methods.
- Operator readiness endpoint that reports router policy, artifact hash, fee, targets, and hook-data gates.
- CI-friendly no-live-market browser E2E against local fork router.
- Regression corpus across route families, input sizes, tiny amounts, and rounding edges.
- Secret-safe fork proxy hardening with timeout diagnostics and batch request coverage.
- Typed quote API client shared by widget and tests.
- Solver observability: quote mode, RPC latency, readiness reason, route ID, and protected minimum metadata.
- Stale artifact and router mismatch runbook.
- Versioned route artifact bundle path so the widget can compare current, staged, and future route snapshots.
- Deterministic local balance funding helpers for fork browser tests.
- Production smoke mode that allows only explicitly configured tiny amounts.
- Automatic promotion checklist from fork route evidence to live config.
- A small public route metadata endpoint for route visualization, excluding executable calldata when not needed.
- Quote API rate limiting and request size bounds.

## Ranked Ideas

### 1. Pinned Archive Fork Validation Lane

**Description:** Establish the default manifest-block fork smoke as a first-class gate by adding an archive-capable Base RPC path, documenting the exact Doppler secret mapping, and rerunning `bun run fame-swap:fork-smoke` with `FAME_SWAP_FORK_BLOCK` unset.

**Rationale:** Latest-state fork validation proves the harness shape, but it does not preserve the deterministic evidence promised by the pinned route manifest. This is the cleanest remaining gap in the original fork-first safety story.

**Downsides:** Requires provider/operator setup outside the repo. Some providers may still need proxy timeout tuning.

**Confidence:** 94%

**Complexity:** Low

**Status:** Unexplored

### 2. Typed Artifact Generation And Sync

**Description:** Add a repeatable artifact sync command that reads `../fame-contracts/test/router/fixtures`, verifies source commit/hash expectations, and writes typed `.ts` modules or an equivalent parsed artifact layer for `www`.

**Rationale:** Runtime hash checks protect execution, but malformed JSON shape still fails later than it should. Typed generated artifacts would make schema drift obvious during development and CI.

**Downsides:** Adds generator maintenance whenever the contract artifact schema evolves. A runtime parser may be simpler if the artifact shape is still moving.

**Confidence:** 90%

**Complexity:** Medium

**Status:** Unexplored

### 3. Quote API Contract And Client Boundary

**Description:** Promote `/api/fame/swap/quote` from an implementation endpoint into a documented quote contract with response fixtures, shared client types, and parity tests against `fameSwapTransactionRequests`.

**Rationale:** The widget currently computes quotes client-side while the API can also materialize routes. Without a crisp contract, UI iterations can accidentally diverge from server quote semantics.

**Downsides:** More surface area to maintain before a second consumer exists. Should stay thin and avoid inventing a large SDK.

**Confidence:** 82%

**Complexity:** Medium

**Status:** Unexplored

### 4. Per-Leg Minimum And Quote Policy Upgrade

**Description:** Extend the live quote path from final post-fee protection to venue-aware per-leg minimums where feasible, using view quotes for simple venues and fork simulation for hard routes.

**Rationale:** The current implementation fixes the most dangerous `minAmountOutAfterFee: 1` issue, but per-leg minimums remain artifact-derived. Stronger per-leg policy would reduce avoidable execution risk in volatile or illiquid paths.

**Downsides:** Venue-specific quote behavior can become complex quickly, especially around V4 hooks and split routes. This should follow fork validation and API contract hardening.

**Confidence:** 76%

**Complexity:** High

**Status:** Unexplored

### 5. Bounded Route Search And Ranking

**Description:** Evolve the solver from curated route IDs into a bounded graph search over the frozen allowed pool universe, ranking direct, multi-hop, split, and merge routes for FAME buy/sell flows.

**Rationale:** The router artifacts prove executable route shapes, but a product-grade swap should eventually choose among route alternatives rather than always selecting the gap-matrix preferred route.

**Downsides:** Search/ranking should not happen until the quote and fork gates are trustworthy. A naive search could generate calldata the router policy does not actually allow.

**Confidence:** 72%

**Complexity:** High

**Status:** Unexplored

### 6. Fork-To-Browser E2E Harness

**Description:** Add a browser-level test loop that starts a local Base fork, deploys or configures the router, launches `/fame/swap`, connects a deterministic wallet context, and exercises quote, approval, swap, and receipt states.

**Rationale:** The current pure tests and fork smoke validate the core mechanics, but the user-facing path still needs proof that the app, wallet hooks, chain switching, and widget states work together.

**Downsides:** Wallet automation can be brittle. Keep this narrow and deterministic before expanding coverage.

**Confidence:** 80%

**Complexity:** Medium

**Status:** Unexplored

### 7. Operator Readiness And Runbook Surface

**Description:** Add a concise operator-facing readiness summary covering router address, chain, schema version, artifact hashes, fee ppm, required venue targets, hook-data gates, pinned-block validation status, and last smoke command.

**Rationale:** Router readiness is currently encoded in code and script output. A launch operator needs one reliable place to answer "why is this route enabled or blocked?"

**Downsides:** It is operational plumbing rather than user-facing product work. It should reuse existing readiness logic and avoid becoming a separate admin app.

**Confidence:** 78%

**Complexity:** Low

**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Treat the current latest-state fork smoke as launch-equivalent | It does not satisfy the manifest-pinned evidence model. |
| 2 | Leave JSON artifacts as unchecked imports forever | Already identified as todo `003`; the failure mode is too avoidable. |
| 3 | Revert to exact-fixture-only amounts | Superseded by the implemented arbitrary-amount route materialization and slippage simulation. |
| 4 | Move all quote logic only into React components | The current API and pure solver boundaries are better test surfaces. |
| 5 | Make an external aggregator the primary quote source | Conflicts with the purpose of the FAME router and its policy gates. |
| 6 | Build an onchain solver | Too expensive and outside the v1 router architecture. |
| 7 | Prioritize route search before pinned fork validation | Ranking more candidates is less valuable than proving the existing route evidence deterministically. |
| 8 | Hide readiness failures behind generic UI copy | Operators need precise readiness reasons to fix router/config issues. |
| 9 | Add broad observability before API contract tests | Useful later, but contract tests catch the more immediate drift risk. |
| 10 | Fold UI hardening back into this solver document | The current widget needs its own UX-focused ideation and workstream. |

## Suggested Brainstorm Seeds

1. Define the pinned archive RPC validation workflow and operator handoff.
2. Define the artifact sync and typed artifact generation contract.
3. Define the quote API contract between backend solver and frontend widget.
4. Define the fork-to-browser E2E scope for one reliable approval/swap path.

## Session Log

- 2026-05-12: Initial ideation research draft. Grounded in the completed FAME router feature branch, the `router-ts` reference solver, `www` Next/wagmi structure, and `fleet` Anvil fork test harness. Generated and filtered 17 candidate directions; 7 survived.
- 2026-05-12: Updated native ETH status after implementation and verification. `FAME -> ETH` and `ETH -> FAME` are now generated solver artifacts and passed pinned Base fork execution in `test_PinnedBaseForkGeneratedSolverRouteTableExecutesEveryRoute`.
- 2026-05-13: Split post-implementation ideation into solver/backend and UI/UX workstreams after reviewing plan status, todos, commit `6c07283`, focused FAME swap tests, lint output, and the current widget screenshot. Generated 24 solver/backend candidates; 7 survived.
