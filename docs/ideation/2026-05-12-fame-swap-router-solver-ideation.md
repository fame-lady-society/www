---
date: 2026-05-12
topic: fame-swap-router-solver-www
focus: "Bring the FAME multi-leg router, reference solver, fork validation, and www swap UI into a compound-engineering handoff"
status: draft
source_branch: feat/fame-multi-leg-router
---

# Ideation: FAME Swap Router, Solver, And `www` Integration

## Purpose

This draft starts the compound-engineering process for building the `www` side of the FAME router work. It uses the current `fame-contracts` feature branch as the grounded source of truth, treats `../www` as the target application, and uses `../fleet` as a reference for Anvil fork-driven integration testing.

The immediate product goal is a comprehensive FAME swap experience at `/fame/swap` that can also be embedded elsewhere as a widget. It should support FAME swaps against ETH, WETH, and USDC through every known pool route that the router and solver can safely represent.

Note: the request mentioned `../wwww`; only `../www` exists locally, so this document assumes `../www`.

## Codebase Context

### `fame-contracts`

The current branch has moved beyond the original scaffold into a production-shaped Base route executor:

- `src/FameRouter.sol` executes exact-input, offchain-built `Route` structs with typed legs, route-local custody accounting, per-leg minimums, a final post-fee minimum, and one 2222 ppm community fee.
- Venue families are explicitly wired: Solidly / Scale-Equalizer, Uniswap V2, Aerodrome Slipstream, Slipstream 2, Universal Router V3, and Universal Router V4.
- The router has owner-controlled fee recipient, fee ppm, venue family enablement, venue target enablement, and V4 hook-data hash enablement.
- The schema uses Solidity ABI encoding with version `1`, `VenueFamily` ordinals `0..5`, and `AmountMode` ordinals `0..2`.
- Native ETH is represented as `address(0)` and is distinct from WETH. The router does not implicitly wrap or unwrap WETH.
- Route-local `balanceOf` reads fail closed, and final ERC-20 delivery is measured at the recipient to catch transfer-tax or malicious under-delivery.
- `RouteExecuted` includes a route hash, schema version, input identity, gross output, fee, and net output.

The branch also includes launch and evidence artifacts:

- `docs/router/fame-router-schema.md`
- `docs/router/fame-router-validation.md`
- `script/DeployFameRouter.s.sol`
- `script/ValidateFameRouterBase.s.sol`
- `router-ts/`
- `test/router/fixtures/base-v1-pools.json`
- `test/router/fixtures/base-v1-routes.json`
- `test/router/fixtures/base-v1-solver-routes.json`
- `test/router/fixtures/base-v1-route-gap-matrix.json`
- `test/router/fixtures/base-v1-route-parity-vectors.json`
- `test/router/fixtures/FameRouterFixtureManifest.sol`
- `test/router/fixtures/FameRouterSolverFixtureManifest.sol`

The checked-in fixture snapshot records 19 pools and 19 launch routes at pinned Base block `45884844`, with status `launchable-pinned-fork-validated`. The reference solver generates 5 additional composed/split evidence routes.

### `router-ts`

`router-ts` is the current reference solver implementation. It is intentionally deterministic and artifact-oriented:

- It reads `test/router/fixtures/base-v1-pools.json`.
- It does not perform live pool discovery or live market ranking.
- It compiles known route candidates into exact `FameRouterTypes.Route` objects.
- It emits JSON artifacts containing route objects, ABI-encoded routes, route hashes, execution context, funding metadata, capabilities, and debug metadata.
- It emits Solidity manifest constants so Foundry can verify JSON hash parity and target allowlists.
- `bun run router:verify` typechecks, runs pure tests, and ensures generated artifacts are current.

The current generated solver route set covers:

- `FAME -> basedflick -> ZORA -> USDC`
- `USDC -> ZORA -> basedflick -> FAME`
- `FAME -> basedflick -> ZORA -> ETH`
- `FAME -> basedflick -> ZORA -> WETH`
- `ETH -> ZORA -> basedflick -> FAME`
- `WETH split -> FAME`
- `USDC split -> frxUSD merge -> FAME`

The gap matrix records the main consumer-facing directions:

- `FAME -> USDC`: supported and fork tested.
- `USDC -> FAME`: supported and fork tested.
- `FAME -> WETH`: supported and fork tested.
- `WETH -> FAME`: supported and fork tested.
- `FAME -> ETH`: supported and fork tested.
- `ETH -> FAME`: supported and fork tested.

Native ETH support is now represented by generated route artifacts and pinned-fork execution evidence. The implementation keeps ETH distinct from WETH while allowing structured V4 payloads to encode `amountIn: 0` for router-computed dynamic amount modes such as `All`, so downstream V4 hops can consume the actual route-local balance without precomputing every intermediate amount.

### `www`

`../www` is a Next.js 14 / React 18 app with App Router routes under `src/app`, domain modules under `src/features`, and wagmi/viem infrastructure already installed.

Relevant local shape:

- Existing FAME page: `src/app/fame/page.tsx` renders `src/features/fame/layout.tsx`.
- Current FAME contract addresses live in `src/features/fame/contract.ts`.
- Base viem client exists at `src/viem/base-client.ts`.
- Wagmi generation pulls Foundry contracts from `../fame-contracts` through `wagmi.config.ts`.
- UI stack includes MUI, Tailwind, Emotion, React Query, ConnectKit, wagmi, and viem.
- Current FAME page still relies on external swap links in places; the new `/fame/swap` route can become the canonical owned swap surface.

The `www` buildout should likely create:

- `src/app/fame/swap/page.tsx`
- `src/features/fame-swap/`
- `src/features/fame-swap/components/FameSwapWidget.tsx`
- `src/features/fame-swap/solver/` or `src/features/fame-swap/service/`
- optional server route such as `src/app/api/fame/swap/quote/route.ts`

### `fleet`

`../fleet` is a Bun workspace with an Express server, React/Vite web app, viem, smart-account support, Zora coin routing, and Anvil fork E2E tests.

Relevant reusable patterns:

- `packages/server/tests/fleet.spec.ts` starts Anvil on a random local port, forks Base, waits for JSON-RPC readiness, starts a server process pointed at that fork, and runs API-level E2E tests against fork state.
- `packages/server/src/services/swapRoute.ts` has deterministic route fallback logic and buy/sell reversal.
- `packages/server/src/services/coinRoute.ts` walks Zora coin ancestry, reads `currency()` and `getPoolKey()`, falls back to storage and factory event discovery, and builds buy/sell paths with pool parameters.
- Tests keep unit logic mocked and fork logic isolated behind explicit E2E modes.

The `www` FAME swap work does not need to copy `fleet` wholesale. The useful idea is the test stance: fork Base, deploy or point at the local router, configure the app against the fork RPC, and verify UI and route execution without live market transactions.

## Past Learnings

The local `fame-contracts` learning `docs/solutions/workflow-issues/public-config-doppler-foundry-aliases-2026-05-12.md` should carry into `www`:

- Public addresses and chain IDs belong in committed config.
- RPC URLs, private keys, explorer keys, mnemonics, and upload keys belong in Doppler or the local secret manager.
- Foundry commands should prefer chain aliases like `base` over raw RPC URLs.
- Scripts and docs should avoid printing secrets.

For `www`, this implies a split between public runtime values such as `NEXT_PUBLIC_FAME_ROUTER_ADDRESS`, `NEXT_PUBLIC_BASE_RPC_URL_1`, and fixture snapshot IDs, versus secret deployer or private RPC values used only in contract deployment and CI.

## Reference Solver Basics

The reference solver is best understood as an artifact compiler, not yet a market router.

Inputs:

- Frozen pool universe from `base-v1-pools.json`.
- Hard-coded candidate route shapes in `router-ts/src/compiler/compileRoute.ts`.
- Token constants in `router-ts/src/config/tokens.ts`.
- Adapter encoders for each venue family.

Core compilation path:

1. Load and validate pool config.
2. Build candidate route definitions with exact amounts, per-leg minimums, route capabilities, and funding metadata.
3. For each leg, find the referenced pool and delegate to the venue-specific encoder.
4. Assemble a `Route` struct matching `FameRouterTypes.Route`.
5. ABI encode the route with viem and compute `keccak256(abi.encode(route))`.
6. Write JSON artifacts plus Solidity manifest constants.
7. Foundry reconstructs the route, checks ABI/hash parity, enables required targets, and executes generated routes on a pinned Base fork.

This is the right reference implementation for `www` because it already captures the hard parts that matter at the contract boundary: schema versioning, enum ordinals, typed payloads, route hashes, hook-data policy, and exact Solidity ABI compatibility.

## Extending The Solver

The next solver should keep the reference compiler as its correctness core and add quoting/search around it deliberately.

### Extension Direction 1: Turn Candidate Routes Into Search Output

Current `candidateRoutes()` is effectively a curated list. The next step is not to discard it, but to treat those candidates as fixtures produced by a more general bounded search:

- Build directed edges from `base-v1-pools.json`.
- Search only within the frozen allowed token/pool universe for v1.
- Prioritize FAME-facing directions: FAME <-> USDC, FAME <-> WETH, FAME <-> ETH.
- Bound depth and payload size to match the router constants.
- Generate direct, multi-hop, split, and split-then-merge candidates.
- Reject any candidate requiring a venue or hook-data shape the router cannot validate.

### Extension Direction 2: Add Quote Providers Per Venue

The solver needs output estimates and per-leg minimums for arbitrary user-entered input amounts. There are two plausible approaches:

- Use venue quote APIs or view methods when they are reliable: V2/Solidly router `getAmountsOut`, V3/Solidly/Slipstream quoters, Universal Router/V4 quote helpers where available.
- Use fork execution simulation as the canonical dev/test quote path for difficult cases, especially V4 hooks and composed routes.

The practical v1 path should support both:

- Pure deterministic artifacts for schema and regression testing.
- Fork quote simulation for development and integration testing.
- Live quote mode only after fork parity is reliable.

### Extension Direction 3: Make Minimums A First-Class Policy

The router enforces `minAmountOut` per leg and `minAmountOutAfterFee` globally. The solver/UI should own the policy that creates those values:

- User slippage setting.
- Per-venue minimum floors.
- Final post-fee minimum display.
- Fee calculation using the live router `feePpm`.
- Rounding direction tests for small amounts.

The UI must display the post-fee minimum, not just a pre-fee quote.

### Extension Direction 4: Keep ETH And WETH Explicit

The current route gap matrix supports both native ETH directions and WETH directions. `www` should not hide the distinction.

Near-term behavior:

- Show WETH routes as executable.
- Show native ETH routes as executable when the generated artifact, router address, schema version, and fixture snapshot hash all match.
- Do not silently map ETH to WETH unless the route explicitly wraps/unwraps through a supported contract behavior.

Future behavior can improve pricing and route selection, but support status should come from the gap matrix rather than UI assumptions.

## Testing Strategy: Fork First, Not Live Market First

The central testing idea is to run the full stack against a fork RPC before any live router deployment or live user transaction.

### Contract Tests

Keep the contract repo as the deepest correctness gate:

- `forge test --match-path 'test/router/*.t.sol' --no-match-contract FameRouterForkBaseTest` for non-fork router tests.
- `bun run router:verify` for solver artifact and parity checks.
- `doppler run --config prd -- sh -c 'BASE_RPC="$RPC_URL" forge test --match-path test/router/FameRouterForkBase.t.sol'` for pinned Base fork route execution.
- `forge build --sizes src/FameRouter.sol` before deployment.
- `script/ValidateFameRouterBase.s.sol` before and after deployment.

The missing-`BASE_RPC` failure is intentional when the manifest is launchable. A green local non-fork suite is not sufficient for launch.

### Solver Tests

The solver test suite should stay layered:

- Pure unit tests for config parsing, adapter payload encoding, amount-mode handling, and route hash parity.
- Golden artifact checks to detect stale generated JSON or manifests.
- Fork simulation tests that execute each generated route against a pinned Base fork.
- Negative tests for stale ETH support assumptions, unsupported hook data, invalid venue targets, schema drift, and stale snapshot hashes.
- Property-style checks for token continuity and no final-output consumption after production.

The solver should expose a stable "quote result" object that includes both human-facing quote data and the exact ABI route to submit.

### `www` Tests

`www` should add tests that prove it is a faithful route consumer:

- Unit tests for route selection, token direction controls, fee/minimum display, and bigint formatting.
- ABI parity tests that compare a fixture route encoded in `www` with the contract repo parity vectors.
- React tests for the widget state machine: disconnected, wrong chain, insufficient balance, approval needed, ready to swap, submitted, confirmed, reverted.
- Playwright E2E for `/fame/swap` using a fork RPC and a local router deployment.
- A no-live-market CI mode that starts Anvil, deploys the router from `../fame-contracts`, points `www` at that RPC/address, and exercises the page with deterministic balances.

Borrow the `fleet` stance: start Anvil on a random port, wait for readiness, inject env for the app process, and clean up the process after tests.

## Live Launch Path

The route from undeployed contract branch to live `www` integration should be explicit:

1. Keep `fame-contracts` green: non-fork tests, `router:verify`, fork matrix, and bytecode size.
2. Load public config from `config/fame-public.env` and secrets from Doppler.
3. Run live validation before deploy against current Base state.
4. Deploy `FameRouter` with `script/DeployFameRouter.s.sol`.
5. Enable every manifest-required venue family and target during deployment.
6. Keep ownership with the deployer until launch gates pass; transfer to the Base multisig only after contract and `www` validation pass.
7. Update `BASE_FAME_ROUTER_ADDRESS` in public config after deployment.
8. Regenerate `www` wagmi outputs including `FameRouter.sol/**`.
9. Add `NEXT_PUBLIC_FAME_ROUTER_ADDRESS`, schema version, and fixture snapshot hash to `www` public config.
10. Run `www` fork E2E against the deployed bytecode and pinned route artifacts.
11. Run a production smoke test with tiny allowed amounts only after all fork checks pass.
12. Promote the widget into existing FAME entry points after `/fame/swap` is stable.

## Ranked Ideas

### 1. Fork-First FAME Swap Lab At `/fame/swap`

**Description:** Build `/fame/swap` first as a production-shaped page backed by a fork-development mode. The page uses the same widget intended for embedding, but initially points at a local Anvil Base fork and a locally deployed router.

**Rationale:** This unlocks frontend development before the router is deployed and makes the full UI, solver, ABI, allowance, route execution, and receipt flow testable without live market risk.

**Downsides:** Requires test infrastructure across repos and careful env management. Wallet UX on Anvil can be awkward unless documented.

**Confidence:** 92%

**Complexity:** Medium

**Status:** Unexplored

### 2. Router Artifact Contract Between `fame-contracts` And `www`

**Description:** Treat the generated route artifacts, parity vectors, gap matrix, schema docs, and fixture snapshot hash as the formal contract consumed by `www`.

**Rationale:** The most dangerous failure mode is schema drift: `www` builds a route that appears valid but encodes differently, uses stale targets, misses fee policy, or submits unsupported hook data. Artifact parity catches that before live users see it.

**Downsides:** Adds artifact sync ceremony. The team needs a clear rule for whether `www` imports from `../fame-contracts`, copies pinned artifacts, or consumes a package.

**Confidence:** 90%

**Complexity:** Medium

**Status:** Unexplored

### 3. Solver Service Boundary Before UI Components

**Description:** Add a thin `www` solver/quote boundary that returns a quote result containing route display data, required approval, call value, route hash, post-fee minimum, warnings, and the exact route args for `executeRoute`.

**Rationale:** The widget should not know how to search pool graphs or encode venue payloads. A service boundary makes the UI reusable and lets quote logic evolve from static artifacts to fork simulation to live quote mode.

**Downsides:** More upfront structure than a one-off page. Needs discipline to avoid turning the server route into an untested black box.

**Confidence:** 88%

**Complexity:** Medium

**Status:** Unexplored

### 4. Widget-First Swap UI With Explicit Capability States

**Description:** Build `FameSwapWidget` as the reusable unit and compose `/fame/swap` around it. The widget exposes compact/full modes and renders explicit states for supported, blocked, fork-only, approval-needed, and executable routes.

**Rationale:** The product needs a page now and drop-in reuse later. Building the widget first prevents `/fame/swap` from becoming a route-specific one-off.

**Downsides:** Requires a clean prop model and transaction state model. Widget reuse should not force over-abstraction before the first route is working.

**Confidence:** 86%

**Complexity:** Medium

**Status:** Unexplored

### 5. Shared Anvil Harness Pattern From `fleet`

**Description:** Port the `fleet` E2E pattern into `www`: random Anvil port, Base fork, readiness polling, app process with fork RPC env, deterministic account funding, and process cleanup.

**Rationale:** This is the safest way to test router, solver, and UI together without relying on live execution. It also gives agents a repeatable loop for future swap work.

**Downsides:** Cross-repo tests can be brittle if paths or local dependencies are implicit. The harness must avoid printing RPC secrets.

**Confidence:** 84%

**Complexity:** Medium

**Status:** Unexplored

### 6. Route Capability And Gap Matrix UI

**Description:** Surface the solver gap matrix in dev/admin mode and optionally in user-facing copy. For example, native ETH and WETH can both be executable while still displaying distinct route paths, call value, approval needs, and settlement behavior.

**Rationale:** The gap matrix is already a high-quality artifact. Using it in `www` prevents silent omissions and makes blocked states intentional.

**Downsides:** Exposing too much route diagnostics to ordinary users can clutter the swap surface. Keep detailed route data behind a dev disclosure or admin view.

**Confidence:** 78%

**Complexity:** Low

**Status:** Unexplored

### 7. Deployment Readiness Panel For The FAME Swap Route

**Description:** Add an internal/development readiness view that checks router address, schema version, fixture snapshot hash, fee ppm, venue target coverage, and fork evidence status before enabling live swaps.

**Rationale:** The contract repo already has validation logic. `www` should fail closed if it is pointed at a router or artifact snapshot that does not match what it was built against.

**Downsides:** This is more operational than user-facing. It should not block the first visible widget prototype, but it should exist before launch.

**Confidence:** 80%

**Complexity:** Medium

**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Use an external aggregator API as the primary route source | Duplicates the router's purpose and weakens route/schema control. |
| 2 | Build an onchain route solver | Explicitly outside the router scope and too expensive for v1. |
| 3 | Ship `/fame/swap` only after live router deployment | Blocks useful UI and integration work that can be done safely on a fork. |
| 4 | Hardcode one Equalizer or Uniswap link as the first version | Already exists conceptually and does not exercise the new router. |
| 5 | Hide ETH/WETH distinction in the UI | Conflicts with the contract schema and current gap matrix evidence. |
| 6 | Move all three repos into one monorepo before building | Too much process overhead relative to the immediate swap goal. |
| 7 | Make the widget call raw Universal Router directly for V3/V4 | Bypasses the constrained router and reintroduces arbitrary route risk. |
| 8 | Use live small swaps as the primary QA loop | Riskier and less reproducible than fork execution. |
| 9 | Copy `fleet` route discovery wholesale into `www` | Useful reference, but FAME router routes have stricter schema and fixture requirements. |
| 10 | Put full solver logic directly inside React components | Makes route correctness hard to test and hard to reuse. |

## Suggested Brainstorm Seeds

The strongest next brainstorm topics are:

1. Define the `FameSwapWidget` product and state machine for `/fame/swap`.
2. Define the `www` solver/quote service contract and artifact sync model.
3. Define the fork-first E2E harness across `fame-contracts` and `www`.
4. Define the live launch checklist and fail-closed production config for `www`.

These should go through `ce:brainstorm` before becoming an implementation plan.

## Open Questions

- Should `www` import `router-ts` directly from `../fame-contracts/router-ts`, copy generated artifacts into its repo, or consume a package published from `fame-contracts`?
- Should quote generation live entirely client-side, in a Next API route, or behind both with a shared pure library?
- How should the widget label native ETH versus WETH now that both are supported but have different call-value and approval behavior?
- Which local account should the fork harness fund for FAME, WETH, USDC, and ETH in Playwright tests?
- Should the router ABI be generated through `wagmi.config.ts` Foundry include, or should `www` keep a minimal ABI for `executeRoute`, `feePpm`, `feeRecipient`, and validation reads?
- Should the first widget version support split-route display, or treat route details as an advanced disclosure?

## Session Log

- 2026-05-12: Initial ideation research draft. Grounded in the completed FAME router feature branch, the `router-ts` reference solver, `www` Next/wagmi structure, and `fleet` Anvil fork test harness. Generated and filtered 17 candidate directions; 7 survived.
- 2026-05-12: Updated native ETH status after implementation and verification. `FAME -> ETH` and `ETH -> FAME` are now generated solver artifacts and passed pinned Base fork execution in `test_PinnedBaseForkGeneratedSolverRouteTableExecutesEveryRoute`.
