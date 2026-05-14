---
title: "feat: Validate FAME swap protocol quoter coverage"
type: feat
status: complete
date: 2026-05-14
source_todo: .context/compound-engineering/todos/007-ready-p1-validate-protocol-quoter-coverage-and-state-outputs.md
depends_on:
  - docs/plans/2026-05-14-001-fame-swap-open-connector-graph-plan.md
---

# feat: Validate FAME Swap Protocol Quoter Coverage

## Overview

Make route-lab evidence explicit about what each protocol adapter can prove for every edge surfaced by the expanded graph matrix. Selected route legs should carry protocol-backed output evidence plus the state outputs that are actually computable. Uniswap V4 must expose Quoter output, `StateView.getSlot0`, `StateView.getLiquidity`, and route-simulation status without inventing a post-swap price. Slipstream2 validation was deferred from this task and is handled by later dedicated adapter work.

## Requirements Trace

- Todo `007`: every selected route leg needs protocol-backed quote evidence and reviewed computable state-output status.
- Todo `007`: protocol coverage must include every selected, considered, rejected, disabled, and missing edge emitted by the todo `011` edge matrix.
- Todo `007`: V4 must expose output, pre-price, active liquidity, and route or one-pool simulation evidence without pretending the current Base V4 Quoter has an after-price field.
- Todo `007`: V3 and Slipstream V1 keep direct after-price evidence from validated quoter outputs.
- Todo `007`: Slipstream2 is not enabled by this plan; a later task must validate a dedicated live quoter path before executable use.
- Todo `011`: route-lab diagnostics must stay non-executable for non-ready states and use recorded-state quote evidence language.

## Scope Boundaries

- Do not enable Slipstream2 in this task; dedicated adapter work must validate the current Slipstream2 pool-family execution path.
- Do not add arbitrary pool discovery or public non-FAME pair support.
- Do not claim V4 post-swap price or full tick-state reconstruction unless the protocol response actually supplies it.
- Do not expose route payloads, approval requests, swap calldata, private RPC URLs, or signer material in route-lab JSON or Markdown.
- Do not change the public quote API contract unless needed to preserve existing ready/non-ready safety semantics.

## Current-State Findings

- `src/features/fame-swap/solver/quotes/liveAdapters.ts` already quotes Solidly, Uniswap V2, Slipstream V1, Uniswap V3, and Uniswap V4 through venue-specific paths.
- V3 and Slipstream V1 parse quoter after-price when available and compute `quoter-price-after` price impact.
- V4 reads `StateView.getSlot0` and calls the Base V4 Quoter, but it does not currently read `StateView.getLiquidity` or surface an explicit active-liquidity state output.
- Slipstream2 initially failed closed with a no-quote-evidence message and was treated as non-executable by the todo `011` matrix pending dedicated validation.
- `scripts/fame-swap-route-lab.ts` now emits edge matrix rows, candidate-generation diagnostics, fee breakdowns, and route-level simulation status, but it does not yet join those into a per-edge protocol coverage table.
- Official Uniswap docs list Base V4 Quoter and StateView deployments, say V4 quotes use simulated quoter calls, and show `StateView.getSlot0` plus `getLiquidity` as the offchain pool-state reads.
- Official Uniswap V3 docs state QuoterV2 returns `amountOut`, `gasEstimate`, `initializedTicksCrossed`, and `sqrtPriceX96After`, which supports the existing V3 after-price path.
- Aerodrome/Velodrome docs describe a bounded graph search and `MixedRouteQuoterV1.quoteExactInput(amountIn, path)` for mixed swap quotes, but that is not enough by itself to enable the separate Slipstream2 pools in this repository.
- Doppler docs confirm V4 dynamic-auction quote flow through a V4 Quoter and Universal Router execution pattern, which supports route-level simulation evidence as the execution check instead of a fabricated V4 after-price.

## Key Technical Decisions

| Decision                                                                                         | Rationale                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add protocol coverage as route-lab/operator evidence, not a public API expansion                 | The coverage matrix is for verifying adapter capability and gaps; users should not receive implementation internals unless the widget deliberately presents them later. If selected-leg protocol evidence is carried through `FameLegQuote`, `/api/fame/swap/quote` must strip it and test that it is not part of the public response.                                              |
| Carry protocol state evidence on selected leg quotes only with API stripping                     | Selected legs already flow through ranking, so this is a narrow implementation path, but the public serializer must remove route-lab-only evidence from `feeBreakdown.legs`.                                                                                                                                                                                                        |
| Derive edge coverage from the todo `011` edge matrix                                             | This guarantees selected, considered, rejected, disabled, and missing rows share the same identity, status, and redaction model.                                                                                                                                                                                                                                                    |
| Read V4 active liquidity from `StateView.getLiquidity` at the quote block as non-gating evidence | The official v4 docs identify this as the offchain active-liquidity read. A failed liquidity read should mark active liquidity unavailable in coverage, not suppress an otherwise valid V4 quoter output.                                                                                                                                                                           |
| Keep V4 post-price unavailable and explicit                                                      | The current Base V4 Quoter shape returns output and gas, not `sqrtPriceX96After`; after-price remains unavailable unless future protocol evidence adds it.                                                                                                                                                                                                                          |
| Keep route simulation as route-lab evidence                                                      | The existing `--live --simulate` path is the right execution boundary for hooks/custom accounting; protocol coverage should show whether route simulation was passed, failed, skipped, or not requested. Recorded mode may report `not_requested`; live simulation proof requires configured RPC plus `FAME_SWAP_SIMULATION_ACCOUNT` or `NEXT_PUBLIC_FAME_SWAP_SIMULATION_ACCOUNT`. |
| Keep Slipstream2 out of this task                                                                | Enabling it requires deployed quoter address, ABI/path encoding, and live/fork proof, so this plan preserved fail-closed behavior until dedicated validation.                                                                                                                                                                                                                       |
| Prefer server-only RPC configuration for API and operator scripts                                | API and route-lab live quote reads should prefer `BASE_RPC_URL` over `NEXT_PUBLIC_BASE_RPC_URL_1`; `NEXT_PUBLIC_*` remains for browser-safe or local endpoints only.                                                                                                                                                                                                                |

## Implementation Units

- [x] **Unit 1: Add Protocol Evidence And Public API Stripping**

**Goal:** Preserve selected-leg proof of quote source and computable state outputs for route-lab coverage while keeping the public quote API contract explicit and safe.

**Files:**

- Modify: `src/features/fame-swap/solver/quotes/adapters.ts`
- Modify: `src/features/fame-swap/solver/quotes/liveAdapters.ts`
- Modify: `src/features/fame-swap/solver/quotes/snapshotAdapter.ts`
- Modify: `src/features/fame-swap/solver/quotes/rankRoutes.ts`
- Modify: `src/features/fame-swap/solver/quotes/asyncRankRoutes.ts`
- Modify: `src/app/api/fame/swap/quote/route.ts`
- Test: `src/features/fame-swap/solver/quotes/liveAdapters.test.ts`
- Test: `src/features/fame-swap/solver/quotes/snapshotAdapter.test.ts`
- Test: `src/features/fame-swap/solver/quotes/rankRoutes.test.ts`
- Test: `src/app/api/fame/swap/quote/route.test.ts`

**Approach:**

- Add a typed, JSON-safe-in-route-lab protocol evidence shape to quote results and selected leg quotes.
- Mark output amount as quoted for successful adapter results.
- Mark pre-price, post-price, market-impact, and active-liquidity outputs as `available`, `unavailable`, `not_applicable`, or `disabled` with display-safe reasons.
- Preserve existing price-impact behavior rather than replacing it.
- Add an explicit API serializer/redaction step that strips route-lab-only protocol evidence from `feeBreakdown.legs` and non-ready diagnostics.
- Add a public API test asserting no `protocolEvidence`, `activeLiquidity`, route-lab coverage rows, RPC URLs, request bodies, or long raw hex appear in ready or non-ready responses.

**Test scenarios:**

- Happy path: V3 and Slipstream V1 selected legs carry output, pre-price, post-price, and market-impact evidence.
- Happy path: V4 selected legs carry output and pre-price evidence but post-price is explicitly unavailable.
- Happy path: constant-product reserve legs carry reserve-derived pre/post price evidence.
- Error path: failed quote results do not contain partial selected-leg evidence.
- Error path: ready and non-ready API responses do not expose route-lab-only protocol evidence.

**Verification:** Focused quote adapter and ranking tests prove selected leg evidence is retained, and API tests prove it is stripped from public responses.

- [x] **Unit 2: Add V4 StateView Liquidity Evidence**

**Goal:** Read and expose V4 active liquidity from the same StateView and block context as V4 pre-price.

**Files:**

- Modify: `src/features/fame-swap/solver/quotes/liveAdapters.ts`
- Test: `src/features/fame-swap/solver/quotes/liveAdapters.test.ts`
- Modify: `docs/fame-swap-route-lab.md`

**Approach:**

- Add a minimal `getLiquidity(bytes32 poolId) returns (uint128)` ABI fragment.
- Read V4 slot0 and active liquidity at the adapter's captured block.
- Include the active liquidity as stringified protocol state evidence on successful V4 quotes when the read succeeds.
- If `getLiquidity` fails or returns malformed data, keep the V4 output quote result and mark active liquidity unavailable with a sanitized reason.
- Keep V4 post-price unavailable with a reason that the current Base V4 Quoter response does not expose `sqrtPriceX96After`.

**Test scenarios:**

- Happy path: V4 quote reads `getSlot0`, `getLiquidity`, and `quoteExactInputSingle` using the configured pool id, StateView, Quoter, and block number.
- Happy path: V4 quote evidence includes active liquidity and does not claim post-price.
- Error path: malformed or failed `getLiquidity` marks active liquidity unavailable without failing an otherwise successful V4 output quote, with diagnostics redacted.

**Verification:** V4 live adapter tests assert the exact StateView calls and evidence fields.

- [x] **Unit 3: Add Route-Lab Protocol Coverage Matrix**

**Goal:** Emit per-edge protocol coverage for every edge matrix row without exposing executable payloads.

**Files:**

- Modify: `src/features/fame-swap/solver/graph/edgeMatrix.ts`
- Modify: `scripts/fame-swap-route-lab.ts`
- Test: `src/features/fame-swap/solver/graph/edgeMatrix.test.ts`
- Test: `scripts/fame-swap-route-lab.test.ts`

**Approach:**

- Build coverage rows by extending the existing edge-matrix route-lab path instead of adding a separate top-level coverage abstraction.
- Inputs are `FameRouteEdgeMatrixRow[]`, the selected quote, candidate rejection diagnostics, and route-lab simulation status.
- For selected rows, attach matching selected leg protocol evidence.
- For considered rows, report that the edge was generated in at least one executable candidate but was not part of the selected route; do not attach selected-leg quote evidence unless ranking retains that exact leg evidence.
- For rejected rows, classify quote adapter failures separately from unsafe output using rejection metadata. Add `failedLegIndex`, `failedPoolId`, and failed `amountIn` to ranking rejections, or explicitly label rows as candidate-level rejections when exact failed-edge attribution is unavailable.
- For disabled rows, report disabled protocol status for edges not enabled by manifest/readiness policy.
- For missing rows, report missing reviewed edge coverage rather than quote failure.
- Include coverage rows in JSON and Markdown with sanitized reasons only.
- Omit or truncate full simulation account addresses in default route-lab JSON/Markdown, or require an explicit include flag.

**Test scenarios:**

- Happy path: every selected/considered/rejected/disabled/missing matrix row has a coverage row.
- Happy path: selected V4 rows show output, pre-price, active liquidity, unavailable post-price, and route simulation status.
- Happy path: considered rows have first-class coverage semantics and do not pretend to have selected-leg evidence.
- Happy path: manifest-disabled rows show disabled quote/state/simulation coverage.
- Happy path: missing WETH/USDC connector probes show missing coverage.
- Error path: rejected rows identify the failed leg when ranking has the failed-leg metadata; otherwise they are labeled candidate-level only.
- Error path: Markdown and JSON coverage contain no calldata, request body, RPC URL, signer material, full simulation account address, or long raw hex.

**Verification:** Route-lab tests prove coverage is complete and display-safe.

- [x] **Unit 4: Refresh Docs, Todo, And Focused Verification**

**Goal:** Mark todo `007` complete only after tests and route-lab evidence show protocol coverage.

**Files:**

- Modify: `docs/fame-swap-route-lab.md`
- Modify: `.context/compound-engineering/todos/007-ready-p1-validate-protocol-quoter-coverage-and-state-outputs.md`
- Optional modify: `docs/plans/2026-05-14-002-fame-swap-protocol-quoter-coverage-plan.md`

**Approach:**

- Update docs to describe protocol coverage, V4 liquidity evidence, V4 missing after-price, and any non-executable protocol status.
- Use "recorded-state quote evidence" in user-facing docs.
- Run focused FAME swap tests and route-lab Markdown output.
- Run recorded route-lab for deterministic coverage and live route-lab when Base RPC is configured. Run `--live --simulate` when a simulation account is configured; otherwise route-lab must surface `not_requested` simulation status without claiming execution proof.
- Rename the todo to complete only after acceptance criteria are checked.

**Test scenarios:**

- Focused quote, protocol coverage, route-lab, graph, amount solver, API, and hook tests pass.
- Route-lab Markdown contains the protocol coverage section and no non-ready executable payloads.
- Live route-lab output shows V4 active-liquidity evidence when RPC is configured; recorded route-lab marks V4 active liquidity unavailable unless the snapshot schema is later extended.

**Verification:** Record exact commands and outcomes in the todo work log.

## Risks

| Risk                                                                            | Likelihood | Impact | Mitigation                                                                                                                                                                   |
| ------------------------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Coverage rows overstate quote safety for considered/rejected edges              | Medium     | High   | Only selected rows can attach selected-leg quote evidence; considered rows are explicitly unselected, and rejected rows use failed-leg metadata or candidate-level labeling. |
| V4 liquidity is mistaken for full capacity proof                                | Medium     | Medium | Label it active liquidity state evidence, not complete liquidity or complete post-swap state proof.                                                                          |
| Route simulation status appears to promise a run when `--simulate` was not used | Medium     | Medium | Use explicit statuses: passed, failed, skipped, or not requested.                                                                                                            |
| Manifest-disabled edges accidentally become executable                          | Low        | High   | Keep manifest-disabled behavior and fail-closed tests.                                                                                                                       |
| Route-lab output leaks diagnostics                                              | Low        | High   | Reuse sanitizer and add coverage-specific redaction tests.                                                                                                                   |
| Operator evidence leaks through `/api/fame/swap/quote`                          | Medium     | High   | Add a serializer test proving protocol coverage and active-liquidity evidence are absent from public responses.                                                              |

## Verification Plan

- `bun test src/features/fame-swap/solver/quotes/liveAdapters.test.ts`
- `bun test src/features/fame-swap/solver/quotes/snapshotAdapter.test.ts`
- `bun test src/features/fame-swap/solver/quotes/rankRoutes.test.ts`
- `bun test scripts/fame-swap-route-lab.test.ts`
- `bun test src/features/fame-swap/solver/graph/edgeMatrix.test.ts`
- `bun test src/features/fame-swap/solver/amountSolver.test.ts`
- `bun test src/app/api/fame/swap/quote/route.test.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts`
- `bun scripts/fame-swap-route-lab.ts --markdown`
- `doppler run -- bun scripts/fame-swap-route-lab.ts --live --markdown` when Base RPC is configured
- `doppler run -- bun scripts/fame-swap-route-lab.ts --live --simulate --markdown` when Base RPC and a simulation account are configured

## External Sources Checked

- Uniswap V4 deployments: `https://developers.uniswap.org/docs/protocols/v4/deployments`
- Uniswap V4 quoting guide: `https://developers.uniswap.org/docs/sdks/v4/guides/swapping/quoting`
- Uniswap V4 pool data guide: `https://developers.uniswap.org/docs/sdks/v4/guides/pool-data`
- Uniswap V4 StateView guide: `https://developers.uniswap.org/docs/protocols/v4/guides/state-view`
- Uniswap V3 quoting guide: `https://developers.uniswap.org/docs/sdks/v3/guides/swapping/quoting`
- Velodrome/Aerodrome SDK docs: `https://github.com/velodrome-finance/docs/blob/main/content/sdk.mdx`
- Doppler quote docs: `https://docs.doppler.lol/reference/quotes-and-swaps`

## Completion Notes

- Implemented selected-leg protocol evidence with public API stripping for ready quote responses.
- Added V4 `StateView.getLiquidity` active-liquidity evidence as a non-gating live adapter read; recorded V4 rows explicitly mark active liquidity unavailable unless the snapshot provides it.
- Added route-lab protocol coverage rows for selected, considered, rejected, disabled, and missing edge-matrix states.
- Kept Slipstream2 out of executable coverage in this task pending dedicated adapter validation.
- Hardened display-safe redaction and Markdown table escaping during review.
- Verified focused tests, Prettier checks, and recorded route-lab Markdown. Fresh live route-lab and live simulation were not run because no Base RPC env var is configured in this shell.
