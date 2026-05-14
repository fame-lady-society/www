---
status: complete
priority: p1
issue_id: "007"
tags: [fame-swap, quoter, price-impact, uniswap-v4, slipstream]
dependencies: ["011"]
---

# Validate Protocol Quoter Coverage And State Outputs

## Problem Statement

Every selected route leg needs protocol-backed quote evidence and a reviewed answer for computable state outputs used in liquidity, market-impact, and route diagnostics. Current live evidence proves Uniswap V4 appears in selected routes, but V4 does not expose the same after-price field as V3 in the current adapter shape, and Slipstream2 is intentionally disabled without a dedicated validated quoter path. This depends on todo `011` because the set of selected/considered legs should come from an open bounded graph search, not only the original route fixtures.

## Findings

- Live Doppler route lab on 2026-05-14 at Base block `45969952` selected Uniswap V4 legs for USDC -> FAME, WETH -> FAME, ETH -> FAME, and FAME -> ETH routes.
- Todo `011` now owns widening candidate generation and the liquidity gap matrix so this protocol evidence work can cover all considered route types, not just selected launch artifacts.
- `src/features/fame-swap/solver/quotes/liveAdapters.ts` quotes Uniswap V3 and Slipstream with after-price evidence, quotes Uniswap V4 output and pre-price evidence, and fails Slipstream2 closed with `has no validated live Slipstream2 quoter`.
- `src/features/fame-swap/solver/quotes/liveAdapters.test.ts` already asserts Slipstream2 fails closed until a dedicated quoter is validated.
- Uniswap official docs list Base V4 Quoter, StateView, and Universal Router deployments; V4 pool data is read through `StateView.getSlot0()` and `StateView.getLiquidity()`, while V4 quote calls use simulated quoter calls rather than normal view calls.
- Uniswap V3 QuoterV2 returns `sqrtPriceX96After`, which supports after-price market-impact calculations directly.
- Aerodrome/Velodrome docs point to `MixedRouteQuoterV1.quoteExactInput(amountIn, path)` for mixed stable/volatile/concentrated Slipstream route quotes.

## Proposed Solutions

### Option 1: Per-Protocol Evidence Matrix

**Approach:** Add a reviewed matrix for every supported venue family and pool variant: quote source, pre-state source, post-state source, computable outputs, disabled reason, and required tests.

**Pros:**

- Makes Slipstream2 disabled status explicit.
- Avoids hiding incomplete state behind vague liquidity language.
- Gives route lab and UI one source of truth for which leg evidence is complete.

**Cons:**

- Does not by itself implement missing post-state simulation for V4 or Slipstream2.

**Effort:** 2-4 hours

**Risk:** Low

### Option 2: Add Simulation-Derived Post-State Evidence

**Approach:** For venues without a quoter after-price, simulate the candidate route or one-pool swap at the initiating wallet's bounded balance amount through the current paid RPC infrastructure, then record simulation evidence separately from direct quoter state.

**Pros:**

- Addresses V4 hooks/custom accounting without inventing an after-price.
- Fits the user's requested below-balance stress-test path.

**Cons:**

- More RPC-heavy and needs careful timeout, redaction, and consistency handling.
- Simulation evidence is not identical to a direct pool after-price field.

**Effort:** 1-2 days

**Risk:** Medium

### Option 3: Implement Dedicated Slipstream2 Quoter Support

**Approach:** Validate Aerodrome Slipstream2 deployed quoter/ABI/path encoding, add venue capability metadata, then enable the live adapter only after route-lab and tests prove it.

**Pros:**

- Removes the current disabled pool-family gap if the deployed infra supports it.
- Keeps disabled status testable until the adapter is real.

**Cons:**

- Requires deployed-contract validation and may still fail if the current pool variant needs a different quoter.

**Effort:** 1 day

**Risk:** Medium

## Recommended Action

After todo `011` defines the expanded graph and gap matrix, do Option 1 immediately, then implement Option 2 for V4 post-state/simulation evidence and Option 3 for Slipstream2 only if live research confirms the deployed quoter path. Keep Slipstream2 marked `DISABLED` in docs/tests until that validation lands. Use "recorded-state quote evidence" in docs and UI-facing language.

## Acceptance Criteria

- [x] Every venue family in the pinned pool universe has an explicit quote source, pre-state source, post-state source, and computable-output status.
- [x] Protocol coverage includes every selected, considered, rejected, disabled, and missing edge emitted by the expanded graph/gap matrix from todo `011`.
- [x] Uniswap V4 routes expose output, pre-price, `StateView` active-liquidity status, and route simulation status without inventing an after-price field.
- [x] Uniswap V3 and Slipstream V1 legs keep direct after-price evidence from their validated quoter outputs.
- [x] Slipstream2 remains explicitly `DISABLED` in code, tests, docs, and route-lab output; enabling it requires a separate dedicated quoter validation task.
- [x] Route lab shows selected V4 routes and selected/non-selected Slipstream2 status in recorded coverage, with prior live Doppler evidence documented at Base block `45969952`.
- [x] No user-facing text or docs describe fake, incomplete, or topology-only data as liquidity evidence.

## Resources

- Uniswap V4 Base deployments: https://developers.uniswap.org/docs/protocols/v4/deployments
- Uniswap V4 quoting guide: https://developers.uniswap.org/docs/sdks/v4/guides/swapping/quoting
- Uniswap V4 pool data guide: https://developers.uniswap.org/docs/sdks/v4/guides/pool-data
- Uniswap V3 quoting guide: https://developers.uniswap.org/docs/sdks/v3/guides/swapping/quoting
- Velodrome/Aerodrome SDK docs for `MixedRouteQuoterV1`: https://github.com/velodrome-finance/docs/blob/main/content/sdk.mdx
- Doppler quote docs: https://docs.doppler.lol/reference/quotes-and-swaps

## Work Log

### 2026-05-14 - Triage

**By:** Codex

**Actions:**

- Created from review feedback and live route-lab status.
- Promoted to P1 because complete leg evidence and computable state outputs are required before clearing the remaining quoter stack.

**Learnings:**

- V4 route support is live, but V4 post-state evidence needs simulation or a documented unavailable status.
- Slipstream2 must be treated as disabled, not partially supported, until a dedicated quoter path is validated.

### 2026-05-14 - Completion

**By:** Codex

**Actions:**

- Added typed protocol evidence for adapter quote output, pre-price, post-price, market impact, and active-liquidity state.
- Carried selected-leg protocol evidence through sync and async route ranking while stripping route-lab-only protocol evidence from public ready quote API responses.
- Added V4 `StateView.getLiquidity` active-liquidity evidence in the live adapter as a non-gating read; recorded V4 rows mark active liquidity unavailable unless the snapshot includes it.
- Added protocol coverage rows derived from the todo `011` edge matrix for selected, considered, rejected, disabled, and missing edges.
- Added failed-leg metadata to route-ranking rejections so rejected coverage can identify the failed pool when available.
- Updated route-lab JSON and Markdown with candidate-generation diagnostics, edge matrix summaries, protocol coverage tables, shortened simulation account labels, and display-safe diagnostics.
- Kept Slipstream2 disabled and fail-closed; no Slipstream2 quoter was enabled in this task.
- Updated route-lab docs to describe protocol coverage, V4 active-liquidity evidence, unavailable V4 after-price, and server-first `BASE_RPC_URL` behavior.
- Ran the required review pass and fixed sanitizer, V4 evidence timing, Markdown escaping, and coverage attribution issues found during review.

**Verification:**

- Passed: `./node_modules/.bin/prettier --check src/features/fame-swap/solver/quotes/adapters.ts src/features/fame-swap/solver/quotes/rankRoutes.ts src/features/fame-swap/solver/quotes/asyncRankRoutes.ts src/features/fame-swap/solver/quotes/liveAdapters.ts src/features/fame-swap/solver/quotes/snapshotAdapter.ts src/features/fame-swap/solver/graph/edgeMatrix.ts scripts/fame-swap-route-lab.ts src/app/api/fame/swap/quote/route.ts src/features/fame-swap/hooks/useFameSwapQuote.ts src/features/fame-swap/solver/readiness.ts docs/fame-swap-route-lab.md`
- Passed: `bun test src/features/fame-swap/solver/quotes/liveAdapters.test.ts src/features/fame-swap/solver/quotes/snapshotAdapter.test.ts src/features/fame-swap/solver/quotes/rankRoutes.test.ts src/features/fame-swap/solver/graph/edgeMatrix.test.ts scripts/fame-swap-route-lab.test.ts src/app/api/fame/swap/quote/route.test.ts src/features/fame-swap/solver/amountSolver.test.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/features/fame-swap/solver/readiness.test.ts`
- Passed: `bun scripts/fame-swap-route-lab.ts --markdown`

**Limitations:**

- Fresh live route-lab and live simulation were not run from this shell because neither `BASE_RPC_URL` nor `NEXT_PUBLIC_BASE_RPC_URL_1` is configured.
