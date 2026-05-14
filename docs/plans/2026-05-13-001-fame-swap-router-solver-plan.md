---
date: 2026-05-13
status: active
origin: docs/brainstorms/2026-05-12-fame-swap-router-solver-requirements.md
topic: fame-swap-router-solver-www
---

# FAME Swap Router Solver Implementation Plan

## Problem Frame

Build the first `www` FAME swap beta at `/fame/swap`: a reusable widget and typed solver boundary that consumes the `FameRouter` artifact set without pretending fixed fork fixtures are live arbitrary quotes. The first implementation ships a fork-first, fail-closed exact-fixture mode. It can show supported FAME <-> USDC, WETH, and native ETH route evidence, encode router payloads, and prepare transaction intent only when the user amount matches a pinned executable route and the route has been materialized for the connected wallet.

## 2026-05-13 Status Review

Recent commit `6c07283 feat(fame-swap): enable live router swaps` materially completed the first backend/router-solver slice and exceeded the original exact-fixture constraint by adding arbitrary positive input amounts, a quote API, live router policy reads, wallet-side simulation, slippage-backed protected minimums, and a local fork harness.

What can be checked off:

- Unit 1 is complete for copied artifacts, manifest metadata, route typing, ABI encoding, route hash parity, and gap-matrix evidence. Follow-up todo `003` remains for generated typed artifact modules or stronger schema parsing.
- Unit 2 is complete, with the exact-fixture-only behavior superseded by arbitrary-amount materialization from pinned route templates plus live readiness and slippage policy.
- Unit 4 is complete for exact ERC-20 approval request construction, native ETH value handling, router transaction construction, protected-route simulation, and receipt tracking. The smoother approve-to-submit user flow is now frontend UX work, not a missing transaction boundary.
- Todo `001` is complete: live slippage-backed quote protection is implemented and the focused tests pass.

What is only partially complete:

- Unit 3 exists as a functional beta widget and state machine, but the current UI is still a technical prototype. The remaining work is a dedicated widget UX pass: FAME-first buy/sell modes, top-level output estimates, price context, route visualization, advanced controls, balance presets, clearer transaction feedback, and theme-aware CTA styling.
- Unit 5 has a fork harness, local router deployment, latest-state smoke validation, operator docs, and local-dev scripts. Pinned manifest-block validation still needs an archive-capable RPC path, tracked by todo `002`.

Open durable todos after this review:

- `002`: validate pinned archive RPC path for default fork smoke.
- `003`: generate typed FAME swap artifacts or add an equivalent schema parser.
- New UI/UX hardening work is tracked in `docs/ideation/2026-05-13-fame-swap-widget-ui-ux-hardening-ideation.md`.

## Source Trace

- Origin requirements: `docs/brainstorms/2026-05-12-fame-swap-router-solver-requirements.md`
- Ideation source: `docs/ideation/2026-05-12-fame-swap-router-solver-ideation.md`
- Contract artifacts: `../fame-contracts/test/router/fixtures/base-v1-solver-routes.json`, `../fame-contracts/test/router/fixtures/base-v1-route-gap-matrix.json`, `../fame-contracts/test/router/fixtures/base-v1-route-parity-vectors.json`, `../fame-contracts/test/router/fixtures/FameRouterSolverFixtureManifest.sol`
- Router ABI source: `../fame-contracts/out/FameRouter.sol/FameRouter.json`
- Relevant local patterns: `src/app/fame/page.tsx`, `src/features/fame/layout.tsx`, `src/features/fame/contract.ts`, `src/context/Wagmi.tsx`, `src/context/wagmiConfig.ts`, `src/features/presale/components/PresaleCard.tsx`, `src/features/naming/components/ClaimNameForm.tsx`

## Research Summary

`www` is a Next.js 14 App Router app using React 18, MUI, Tailwind, ConnectKit, wagmi, viem, and generated contract hooks. The app has no committed vitest or Playwright dependency, but Bun is available locally and existing TypeScript tests use `node:test` assertions under `src/features/naming/attestations/__tests__/attestations.test.ts`. The plan should therefore keep core verification in pure TypeScript files runnable with `bun test`, and leave heavier browser/fork coverage behind scripts that do not add new package dependencies.

No `docs/solutions/` directory exists in this repo, so there were no local institutional learnings to carry forward. The `fleet` reference confirms a useful fork harness shape: random Anvil port, readiness polling through JSON-RPC, child process cleanup, env injection, and no secret logging.

## Key Decisions

- Pin artifacts inside `www` for v1 rather than requiring `../fame-contracts` at runtime. Direct sibling reads are only for sync/local verification.
- Use a minimal local `FameRouter` ABI for `executeRoute`, `hashRoute`, `feePpm`, `venueFamilyEnabled`, `venueTargetEnabled`, and `v4HookDataHashEnabled`; do not regenerate wagmi outputs in this slice.
- Make exact fixture amounts the only executable v1 quote path. Arbitrary user amounts return a typed blocked quote with clear copy and no submit capability.
- Reserve checked-in route hashes for artifact/parity evidence. Before live or fork submission, materialize a fresh route by replacing the fixture recipient with the connected wallet, setting a bounded fresh deadline, and recomputing encoded route and route hash.
- Keep quote and state logic pure where possible so it can be covered without wallet/browser test infrastructure.
- Build the UI in the existing MUI/Tailwind style, not a separate design system. Use full mode on `/fame/swap`; compact mode is a constrained prop, not a second product.
- Keep live transaction submission fail-closed unless a router address and live readiness data are configured. This page can be public beta without claiming live router execution is available.

## Implementation Units

### Unit 1: Pinned Artifact Contract And Route Encoding

**Status:** completed

**Goal:** Bring the contract artifact boundary into `www` with strongly typed schemas and route ABI parity checks.

**Files:**
- `src/features/fame-swap/artifacts/base-v1-solver-routes.json`
- `src/features/fame-swap/artifacts/base-v1-route-gap-matrix.json`
- `src/features/fame-swap/artifacts/base-v1-route-parity-vectors.json`
- `src/features/fame-swap/artifacts/manifest.ts`
- `src/features/fame-swap/router/types.ts`
- `src/features/fame-swap/router/encodeRoute.ts`
- `src/features/fame-swap/router/encodeRoute.test.ts`

**Approach:**
- Copy the three JSON artifacts into `www` as the v1 pinned source.
- Capture the `../fame-contracts` branch, commit, pinned block, route count, and manifest hashes from `FameRouterSolverFixtureManifest.sol` in `manifest.ts`.
- Define route, leg, artifact, gap row, and parity-vector types using `Address` and `Hex` from viem.
- Encode route tuples with `encodeAbiParameters` using the same ABI tuple shape as `router-ts/src/artifacts/routeEncoding.ts`.
- Convert JSON string amounts into bigint only at the typed boundary.

**Test Scenarios:**
- Every parity vector encodes to the checked-in `abiEncodedRoute`.
- Every parity vector hashes to the checked-in `routeHash`.
- Every copied artifact route id appears in the manifest route id set.
- The gap matrix rows for FAME <-> USDC, FAME <-> WETH, and FAME <-> ETH are executable, TS-generated, and fork-tested.

**Verification:** `bun test src/features/fame-swap/router/encodeRoute.test.ts`

### Unit 2: Exact-Fixture Solver And Readiness Model

**Status:** completed

**Goal:** Add a typed solver/quote service that turns pinned route artifacts into safe quote results and fail-closed readiness states.

**Files:**
- `src/features/fame-swap/tokens.ts`
- `src/features/fame-swap/config.ts`
- `src/features/fame-swap/solver/types.ts`
- `src/features/fame-swap/solver/artifacts.ts`
- `src/features/fame-swap/solver/quote.ts`
- `src/features/fame-swap/solver/materializeRoute.ts`
- `src/features/fame-swap/solver/readiness.ts`
- `src/features/fame-swap/solver/format.ts`
- `src/features/fame-swap/solver/quote.test.ts`
- `src/features/fame-swap/solver/readiness.test.ts`

**Approach:**
- Model supported tokens as FAME, USDC, WETH, and native ETH, with native ETH represented by `0x0000000000000000000000000000000000000000`.
- Select routes by token pair through the pinned gap matrix and route artifacts.
- Return discriminated quote results: `ready`, `amount_mismatch`, `unsupported`, `stale_artifact`, and `not_live_ready`.
- For `ready`, require the requested input amount to exactly match the artifact amount. Build approval requirements for ERC-20 inputs with exact quoted amount and call value for native ETH.
- Expose route display details, split capability flags, final post-fee minimum, fee ppm assumption, fixture route hash, materialized route hash, and exact `executeRoute` argument.
- Materialize executable routes with a caller-provided recipient and deadline; fixture recipients must never be used in transaction requests.
- Add config helpers that read only public config values: router address, expected schema version, expected pinned block, expected artifact hash, and beta/live mode.
- Define readiness as an on-chain check against the configured Base router when live execution is enabled: read `feePpm`, every required `venueFamilyEnabled`, every required `venueTargetEnabled`, and every required `v4HookDataHashEnabled` entry from the pinned manifest. Missing reads, false flags, fee mismatch, RPC errors, or absent router address return `not_live_ready`.

**Test Scenarios:**
- Exact fixture amount for each supported direction returns a typed quote with route payload and no arbitrary amount mutation.
- Arbitrary non-fixture amount returns `amount_mismatch`, no executable transaction, and a suggested exact evidence amount.
- Native ETH input has call value equal to `amountIn` and no ERC-20 approval.
- ERC-20 input has exact approval requirement for router spender and amount.
- Unsupported pair returns `unsupported` with available directions.
- Missing or mismatched public config produces fail-closed readiness.
- Materialization replaces the fixture recipient, sets a fresh bounded deadline, and recomputes route encoding/hash.
- Readiness returns `not_live_ready` for false venue family, false venue target, false hook hash, fee mismatch, and read errors.

**Verification:** `bun test src/features/fame-swap/solver/quote.test.ts src/features/fame-swap/solver/readiness.test.ts`

### Unit 3: Widget State Machine And `/fame/swap` Page

**Status:** partial

**Goal:** Build a reusable `FameSwapWidget` and App Router page with explicit state copy, compact/full modes, route diagnostics, and accessible mobile-first controls.

**Files:**
- `src/app/fame/swap/page.tsx`
- `src/features/fame-swap/components/FameSwapWidget.tsx`
- `src/features/fame-swap/components/RouteDiagnostics.tsx`
- `src/features/fame-swap/components/SwapAmountField.tsx`
- `src/features/fame-swap/components/TokenSelect.tsx`
- `src/features/fame-swap/state.ts`
- `src/features/fame-swap/state.test.ts`

**Approach:**
- Keep the page as a Server Component that renders the client widget.
- Implement full mode for `/fame/swap`; compact mode hides diagnostics by default but never hides critical warnings, approval requirements, or final post-fee minimums.
- Build a pure state mapper for disconnected, wrong-chain, amount-entry, unsupported-route, stale-artifact, not-live-ready, approval-needed, ready, submitting, confirmed, and reverted states.
- Define state copy in `state.ts` rather than inline in JSX. Required baseline copy:
  - Disconnected: CTA `Connect wallet`; recovery is wallet connection.
  - Wrong chain: CTA `Switch to Base`; recovery is chain switch.
  - Amount entry: CTA `Enter an exact evidence amount`; recovery is selecting a supported evidence amount.
  - Unsupported route: CTA `Choose another pair`; recovery is token selection.
  - Stale artifact: CTA `Swap unavailable`; recovery is external fallback and diagnostics.
  - Not-live-ready: CTA `Router beta unavailable`; recovery is external fallback and diagnostics.
  - Approval needed: CTA `Approve exact amount`; recovery is approval retry.
  - Ready: CTA `Swap with FAME router`; recovery is edit amount or pair.
  - Submitting: CTA `Submitting`; recovery is wait for wallet/receipt.
  - Confirmed: CTA `Swap confirmed`; recovery is view transaction or start another swap.
  - Reverted: CTA `Try again`; recovery is retry after reviewing diagnostics.
- Use MUI controls and existing ConnectKit/wagmi patterns; keep styling local to the feature and avoid nested cards.
- Show external fallback links only for stale-artifact and not-live-ready states. Fallback links must be hardcoded from an allowlisted destination set, use `rel="noopener noreferrer"` for new tabs, and never include user-controlled redirect URLs.
- Accessibility requirements: token selects and amount inputs must be keyboard reachable with visible focus, primary CTA focus must return after wallet/transaction state changes, diagnostics disclosure must be button-controlled with `aria-expanded`, and tap targets must be at least 44px high on mobile.

**Test Scenarios:**
- State mapper returns expected CTA, disabled fields, recovery action, and diagnostics visibility for every widget state.
- Wrong-chain state prefers switching to Base before quote submission.
- Amount mismatch state shows the exact executable evidence amount and disables swap submission.
- Not-live-ready state shows the external fallback and route diagnostics while disabling router submission.
- Compact mode keeps critical warning and final post-fee minimum visible.

**Verification:** `bun test src/features/fame-swap/state.test.ts`

### Unit 4: Wallet Transaction Boundary

**Status:** completed

**Goal:** Add a narrowly scoped transaction hook that can approve exact ERC-20 allowance and submit `executeRoute` only when the quote and readiness state allow it.

**Files:**
- `src/features/fame-swap/router/abi.ts`
- `src/features/fame-swap/router/erc20Abi.ts`
- `src/features/fame-swap/hooks/useFameSwapTransaction.ts`
- `src/features/fame-swap/transactions.ts`
- `src/features/fame-swap/transactions.test.ts`
- `src/features/fame-swap/components/FameSwapWidget.tsx`

**Approach:**
- Use minimal ABIs and `useWriteContract`, `useWaitForTransactionReceipt`, and `useSwitchChain`.
- Build pure transaction request objects from materialized routes first, then have the hook submit them through wagmi.
- Never submit approval or swap when quote status is not executable, chain is not Base, router address is absent, or readiness is fail-closed.
- Default ERC-20 approval to exact input amount.

**Test Scenarios:**
- ERC-20 quote builds an exact approval request and a router `executeRoute` request.
- Native ETH quote builds only the router request with `value`.
- Non-executable quote builds no transaction requests.
- Router address absence returns fail-closed state.
- Transaction requests never use the fixture recipient and always use the materialized route hash.

**Verification:** `bun test src/features/fame-swap/transactions.test.ts`

### Unit 5: Minimal Fork Execution Harness And Operator Notes

**Status:** partial

**Goal:** Provide a safe local fork execution gate that proves at least one pinned exact-fixture route can be materialized and simulated or executed against a Base fork without leaking secrets.

**Files:**
- `scripts/fame-swap-fork-smoke.ts`
- `docs/fame-swap-fork-validation.md`
- `package.json`

**Approach:**
- Create `scripts/` and add a script that locates `anvil` on `PATH`, starts it on a random local port using `BASE_RPC_URL` from the environment, waits for JSON-RPC readiness, checks copied artifact hashes, reads router readiness when `NEXT_PUBLIC_FAME_ROUTER_ADDRESS` is set, and always cleans up the child process.
- When a router address is configured, the script must materialize one pinned route for a local Anvil account, run `simulateContract` for `executeRoute`, and report a pass/fail result without printing RPC secrets. When no router address is configured, the script exits with a clear fail-closed message rather than counting as fork execution success.
- Document the intended invocation through Doppler, using `BASE_RPC_URL="$RPC_URL"` in the child environment without printing the secret.
- Local router deployment and Playwright browser execution remain follow-up work, but at least one fork simulation against a configured router is required before marking the fork gate complete.

**Test Scenarios:**
- Missing `BASE_RPC_URL` exits with an actionable message and no secret logging.
- Missing `anvil` exits with an actionable Foundry prerequisite message.
- Anvil readiness polling succeeds against a valid RPC.
- Missing router address fails closed and does not claim fork execution success.
- Configured router path reads readiness and simulates one materialized exact route.

**Verification:** `doppler run --config prd -- sh -c 'BASE_RPC_URL="$RPC_URL" NEXT_PUBLIC_FAME_ROUTER_ADDRESS="$ROUTER" bun scripts/fame-swap-fork-smoke.ts'`

## Sequencing

1. Unit 1 first: all later work depends on pinned artifacts and route encoding.
2. Unit 2 next: solver/readiness defines what the UI and transactions may do.
3. Units 3 and 4 after the solver. Unit 3 can build against mocked quote results while Unit 4 builds pure request generation, then the hook is wired into the widget.
4. Unit 5 last: it validates fork execution posture after the pure route materialization and transaction boundaries exist.

## Verification Gates

- `bun test src/features/fame-swap/router/encodeRoute.test.ts`
- `bun test src/features/fame-swap/solver/quote.test.ts src/features/fame-swap/solver/readiness.test.ts`
- `bun test src/features/fame-swap/state.test.ts src/features/fame-swap/transactions.test.ts`
- `yarn lint`
- `yarn build`
- Fork smoke: `doppler run --config prd -- sh -c 'BASE_RPC_URL="$RPC_URL" NEXT_PUBLIC_FAME_ROUTER_ADDRESS="$ROUTER" bun scripts/fame-swap-fork-smoke.ts'`

## Deferred Work To Track As Durable TODOs If Not Completed

- Pinned archive RPC path for deterministic manifest-block fork smoke.
- Generated typed artifact modules or runtime schema parsing for copied route JSON.
- Full browser E2E against `/fame/swap` with a local router deployment and wallet flow.
- Widget UI/UX hardening before promoting the beta into existing FAME page entry points.
- Automated artifact sync command from `../fame-contracts`.
