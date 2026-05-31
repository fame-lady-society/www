---
title: "feat: Add one Uniswap V3 WETH/USDC compact CL quote slice"
type: feat
status: active
date: 2026-05-27
origin: docs/brainstorms/2026-05-23-fame-pool-api-quoter-migration-requirements.md
---

# feat: Add one Uniswap V3 WETH/USDC compact CL quote slice

## Summary

Add exactly one Uniswap V3 WETH/USDC pool to the indexed compact quote path so `www` can use a fresh `cl-quote-v1` row from `FAME_POOL_API_URL` + `/fame/pool-quotes` when it is valid, while preserving live fallback for every stale, missing, malformed, registry-mismatched, source-mismatched, outside-range, or replay-failing case.

**Target pool:** `uniswap-v3-usdc-weth-5bps`.

**Target repos:** `www` and `society-bots`. File paths below are repo-relative within the named target repo.

## Problem Frame

The compact quote migration is now production-tested for `slipstream-usdc-weth-100` and reserve `constant-product-quote-v1` rows. The next useful slice is not a broad CL rollout; it is a one-pool proof that the same compact quote boundary can safely handle a Uniswap V3 WETH/USDC pool.

The implementation should reuse the current producer/consumer contract wherever possible: `society-bots` produces compact quotes from indexed replay state, and `www` validates quote rows against local route metadata before use. Raw `/fame/pool-state` remains available for route-lab and parity proof only, not normal quote execution.

## Scope Boundary

In scope:

- Make `uniswap-v3-usdc-weth-5bps` replay-capable and compact-quote-capable.
- Preserve existing `slipstream-usdc-weth-100` `cl-quote-v1` behavior.
- Preserve existing `constant-product-quote-v1` reserve row behavior.
- Prove same-block parity for both WETH -> USDC and USDC -> WETH across representative amount bands.
- Keep `/api/fame/swap/quote` on compact `/fame/pool-quotes` for normal quote flow.

Out of scope:

- Adding `uniswap-v3-usdc-weth-30bps` in the same slice.
- Adding broad Uniswap V3, Slipstream2, Uniswap V4, or multi-pool CL replay support.
- Dense replay optimization, tick cursoring, partial-window replay, or adaptive tick bounds beyond the current full-bitmap replay model.
- Removing raw `/fame/pool-state` tooling.
- Changing wallet execution semantics.

## Requirements

- R1. `uniswap-v3-usdc-weth-5bps` becomes the only new CL replay-capable pool in the registry and compact quote allowlist.
- R2. `society-bots` produces `cl-quote-v1` rows for fresh indexed replay state for that pool in both token directions.
- R3. `society-bots` returns typed unavailable rows, not thrown user-facing failures, for missing state, stale state, registry mismatch, token direction mismatch, malformed replay state, outside-range replay, and replay failure.
- R4. `www` accepts a Uniswap V3 `cl-quote-v1` row only when pool id, chain id, pool address, token order, direction, amount, source registry id, freshness, row source, fee metadata, and quote kind match the local edge.
- R5. `www` live-fallbacks the edge when the compact quote batch fails, times out, returns unavailable, returns malformed data, returns mismatched data, or returns a replay failure.
- R6. `includeDebug: true` exposes compact quote API evidence for the selected Uniswap V3 row or fallback reason without raw tick payloads, service tokens, helper URLs, or server log lines.
- R7. Raw `/fame/pool-state` remains explicit proof/debug tooling only; normal `/api/fame/swap/quote` must not call it.
- R8. Same-block parity proof covers both directions and representative small, medium, and route-relevant larger amounts before promotion.

## First Pool Decision

Choose `uniswap-v3-usdc-weth-5bps` first.

Existing route universe evidence:

- `src/features/fame-swap/artifacts/base-v1-pools.json` contains both reviewed candidates:
  - `uniswap-v3-usdc-weth-5bps`, pool `0xd0b53d9277642d899df5c87a3966a349a798f224`, WETH token0, USDC token1, fee `500`, tick spacing `10`.
  - `uniswap-v3-usdc-weth-30bps`, pool `0x6c561b446416e1a00e8e93e221854d6ea4171372`, WETH token0, USDC token1, fee `3000`, tick spacing `60`.
- `src/features/fame-swap/solver/poolStateRegistry.ts` already marks Uniswap V3 pools as `market-state` with `stateSurface: "cl-head-snapshot"` when they have fee and tick metadata.
- `src/features/fame-swap/solver/poolStateRegistry.ts` currently allows compact CL quote usage only for `slipstream-usdc-weth-100`.
- `society-bots` `src/fame-swap-pool-state/registry/base-v1-pools.json` mirrors both Uniswap V3 WETH/USDC pools as `market-state` with `replaySurface: null`.

Rationale:

- The 5 bps pool is the lower-fee WETH/USDC connector already present in the reviewed route universe.
- Its tick spacing `10` makes it the stricter replay test than the 30 bps pool's tick spacing `60`; proving it first is more valuable than picking the easier wider-grid pool.
- Adding one lower-fee connector is the smallest useful extension of the compact CL quote path without converting the slice into "all Uniswap V3".

`uniswap-v3-usdc-weth-30bps` stays deferred unless live same-block research before implementation shows the 5 bps pool is unusable for current route amounts or routinely falls outside the indexed replay range.

## Key Technical Decisions

- **One-pool allowlist:** Add `uniswap-v3-usdc-weth-5bps` to the CL replay/compact quote allowlist and no other CL pool.
- **Reuse `cl-quote-v1`:** Do not create `uniswap-v3-cl-quote-v1` unless implementation discovers a required wire distinction. The current row already carries `venueFamily`, fee, tick spacing, pool identity, before/after price, amount, source registry id, state hash, and snapshot id.
- **Source must distinguish venue:** The current `source: "slipstream-pool-state"` is too narrow for Uniswap V3. Extend the source enum minimally to include `uniswap-v3-pool-state`, and require `www` to validate source against the local pool venue.
- **Registry-driven promotion:** `www` remains authoritative for reviewed route metadata. `society-bots` receives the generated registry artifact, and the `sourceRegistryId` changes when the registry changes.
- **Producer deploys first:** Deploy `society-bots` indexing and quote support before enabling the new `www` compact quote allowlist in production.
- **Same-block proof remains the promotion gate:** `includeDebug: true` proves the quote path attempted/used/fell back; route-lab proves indexed route evidence; the parity harness proves exact same-block replay against the live Uniswap V3 quoter.

## Implementation Units

### U1. Promote one Uniswap V3 pool in the generated registry

**Goal:** Make `uniswap-v3-usdc-weth-5bps` the only new CL replay-capable and compact-quote-capable pool.

**Requirements:** R1, R4.

**Dependencies:** None.

**Files:**

| Repo | Action | Path |
| --- | --- | --- |
| `www` | Modify | `src/features/fame-swap/solver/poolStateRegistry.ts` |
| `www` | Test | `src/features/fame-swap/solver/poolStateRegistry.test.ts` |
| `www` | Regenerate/check | `src/features/fame-swap/artifacts/base-v1-pools.json` |
| `society-bots` | Modify | `src/fame-swap-pool-state/registry/base-v1-pools.json` |
| `society-bots` | Modify | `src/fame-swap-pool-state/registry/index.ts` |
| `society-bots` | Test | `src/fame-swap-pool-state/registry/index.test.ts` |
| `society-bots` | Modify | `src/fame-swap-pool-state/types.ts` |

**Approach:**

- Add `uniswap-v3-usdc-weth-5bps` to the `www` CL replay-capable pool list.
- Keep `uniswap-v3-usdc-weth-30bps` as `market-state` with `replaySurface: null`.
- Preserve `slipstream-usdc-weth-100` in the same allowlist.
- Update registry parser types in `society-bots` so replay-capable entries may be either `aerodrome-slipstream` or `uniswap-v3` while still requiring a concrete pool address, tick spacing, fee metadata, and `stateSurface: "cl-head-snapshot"`.
- Copy/regenerate the registry artifact into `society-bots` with the new source id.

**Test scenarios:**

- Happy path: registry replay-capable ids are exactly `slipstream-usdc-weth-100` and `uniswap-v3-usdc-weth-5bps`.
- Regression: `uniswap-v3-usdc-weth-30bps` remains non-replay-capable.
- Validation: a replay-capable Uniswap V3 row missing fee, tick spacing, pool address, or token metadata fails registry parsing.
- Contract: compact quote capable ids equal reserve quote-model ids plus the two replay-capable CL ids.

### U2. Generalize CL replay snapshot reads for one Uniswap V3 pool

**Goal:** Let `society-bots` index full replay capsules for `uniswap-v3-usdc-weth-5bps` using the same bounded one-pool mechanics that already support Slipstream.

**Requirements:** R2, R3, R8.

**Dependencies:** U1.

**Files:**

| Repo | Action | Path |
| --- | --- | --- |
| `society-bots` | Modify | `src/fame-swap-pool-state/indexer.ts` |
| `society-bots` | Test | `src/fame-swap-pool-state/indexer.test.ts` |
| `society-bots` | Modify | `src/fame-swap-pool-state/dynamodb/pool-state.ts` |
| `society-bots` | Test | `src/fame-swap-pool-state/dynamodb/pool-state.test.ts` |

**Approach:**

- Rename implementation concepts only where useful from Slipstream-specific to generic CL replay naming; keep behavior stable.
- Add a Uniswap V3 replay reader that uses:
  - `slot0()` with the Uniswap V3 ABI.
  - `liquidity()`.
  - Uniswap V3 fee pips derived from reviewed pool metadata. For the target pool, the pool artifact fee is `500`; the generated registry `feeBps: 5` is display/registry metadata and must not be passed directly into the CL swap loop.
  - `tickBitmap(int16)` and `ticks(int24)` with the Uniswap V3 tick ABI, not the Slipstream tick ABI.
- Store a source value of `uniswap-v3-pool-state` for Uniswap V3 replay rows and keep `slipstream-pool-state` for Slipstream rows.
- Keep the current full initialized-tick bitmap model for this one pool. Do not add dense bounds or cursoring in this slice.
- Keep the current block identity guard: block hash and parent hash must remain stable across the replay read.
- Preserve existing CL replay failure aggregation and sanitized indexer logging.

**Test scenarios:**

- Happy path: indexing writes a `cl-replay-v1` latest row and chunks for `uniswap-v3-usdc-weth-5bps` with source `uniswap-v3-pool-state`.
- Regression: existing `slipstream-usdc-weth-100` indexing still writes source `slipstream-pool-state`.
- Validation: Uniswap V3 replay rows parse with source `uniswap-v3-pool-state`; Slipstream rows still reject any non-Slipstream source.
- Error path: block identity drift rejects the snapshot and does not update the latest pointer.
- Error path: malformed tick bitmap or a bitmap-marked tick that is not initialized rejects the snapshot.
- Scope guard: no replay rows are written for `uniswap-v3-usdc-weth-30bps`.

### U3. Produce Uniswap V3 `cl-quote-v1` rows from indexed replay

**Goal:** Extend `/fame/pool-quotes` so it can quote `uniswap-v3-usdc-weth-5bps` from fresh replay state.

**Requirements:** R2, R3, R6.

**Dependencies:** U1, U2.

**Files:**

| Repo | Action | Path |
| --- | --- | --- |
| `society-bots` | Modify | `src/fame-swap-pool-state/cl-quote.ts` |
| `society-bots` | Test | `src/fame-swap-pool-state/api.test.ts` |
| `society-bots` | Modify | `src/fame-swap-pool-state/fixtures/pool-quotes-v1.json` |
| `society-bots` | Modify | `docs/fame-pool-state-index.md` |

**Approach:**

- Generalize `isClReplayPool` so it accepts only replay-capable registry entries for `slipstream-usdc-weth-100` and `uniswap-v3-usdc-weth-5bps`.
- Generalize the existing CL exact-input replay loop if the math is venue-neutral. Keep venue-specific parsing and source validation outside the math.
- Use the pool's stored replay fee exactly as the quote fee pips. For Uniswap V3, that should be `500` fee pips for the 5 bps pool, not the registry display value `feeBps: 5`.
- Return `cl-quote-v1` with `source: "uniswap-v3-pool-state"` for the new pool.
- Preserve unavailable reasons for stale state, missing state, source registry mismatch, token direction mismatch, malformed replay state, outside indexed tick range, and replay failure.
- Keep reserve `constant-product-quote-v1` logic unchanged.

**Test scenarios:**

- Happy path: `/fame/pool-quotes` returns a quoted `cl-quote-v1` row for WETH -> USDC on `uniswap-v3-usdc-weth-5bps`.
- Happy path: `/fame/pool-quotes` returns a quoted `cl-quote-v1` row for USDC -> WETH on `uniswap-v3-usdc-weth-5bps`.
- Regression: `slipstream-usdc-weth-100` still returns `cl-quote-v1` with source `slipstream-pool-state`.
- Regression: reserve pools still return `constant-product-quote-v1`.
- Fallback: stale, missing, registry-mismatched, token-direction-mismatched, malformed, outside-range, and replay-failing rows return typed `unavailable` entries.
- Scope guard: `uniswap-v3-usdc-weth-30bps` returns `unsupported-pool`.
- Debug safety: response fixtures do not contain raw tick arrays, bitmap words, helper URLs, tokens, or request bodies.

### U4. Accept and attribute the Uniswap V3 compact quote row in `www`

**Goal:** Let normal quote execution use the new Uniswap V3 compact quote row only when it validates against local route metadata.

**Requirements:** R4, R5, R6, R7.

**Dependencies:** U1, U3 producer contract.

**Files:**

| Repo | Action | Path |
| --- | --- | --- |
| `www` | Modify | `src/features/fame-swap/solver/quotes/indexedQuoteApiClient.ts` |
| `www` | Test | `src/features/fame-swap/solver/quotes/indexedQuoteApiClient.test.ts` |
| `www` | Modify | `src/features/fame-swap/solver/quotes/indexedQuoteApiAdapter.ts` |
| `www` | Test | `src/features/fame-swap/solver/quotes/indexedQuoteApiAdapter.test.ts` |
| `www` | Modify | `src/features/fame-swap/solver/quotes/fixtures/pool-quotes-v1.json` |
| `www` | Test | `src/app/api/fame/swap/quote/route.test.ts` |

**Approach:**

- Extend the `cl-quote-v1` parser source enum to include `uniswap-v3-pool-state`.
- Validate row source by venue:
  - `aerodrome-slipstream` requires `slipstream-pool-state`.
  - `uniswap-v3` requires `uniswap-v3-pool-state`.
- Add `uniswap-v3-usdc-weth-5bps` to `requestSupportedByQuoteApi` through the registry-derived CL allowlist.
- Reuse current CL quote conversion and concentrated liquidity price impact behavior where row fields match the existing adapter contract.
- Keep live fallback for row source mismatch, row metadata mismatch, row kind mismatch, amount invalidity, price impact invalidity, source registry mismatch, unavailable rows, HTTP failure, invalid response, and timeout.
- Preserve normal quote flow on `/fame/pool-quotes`; do not call `indexedPoolStateClient.ts` from the handler.

**Test scenarios:**

- Happy path: adapter uses a valid `uniswap-v3-usdc-weth-5bps` `cl-quote-v1` row and marks the quote context as indexed.
- Happy path: route handler debug for a route using the new pool reports `debug.quoteApi.attempted: true`, `usedCount > 0`, selected route source evidence, and no raw pool-state payload.
- Fallback: source `slipstream-pool-state` on the Uniswap V3 row is rejected and live-fallbacks.
- Fallback: source registry mismatch live-fallbacks with sanitized diagnostics.
- Fallback: stale, unavailable, malformed, wrong amount, wrong token order, wrong pool address, wrong chain id, wrong fee, wrong quote kind, and timeout cases live-fallback.
- Regression: `slipstream-usdc-weth-100` compact quote usage remains accepted.
- Regression: reserve `constant-product-quote-v1` rows remain accepted.
- Guard: normal handler tests prove `/fame/pool-state` is not called.

### U5. Update same-block parity and route-lab evidence

**Goal:** Make promotion proof cover the new Uniswap V3 pool with exact same-block parity and operator-readable compact quote evidence.

**Requirements:** R6, R8.

**Dependencies:** U1 through U4.

**Files:**

| Repo | Action | Path |
| --- | --- | --- |
| `www` | Modify | `scripts/fame-swap-cl-replay-parity.ts` |
| `www` | Test | `scripts/fame-swap-cl-replay-parity.test.ts` |
| `www` | Modify | `scripts/fame-swap-route-lab.ts` |
| `www` | Test | `scripts/fame-swap-route-lab.test.ts` |
| `www` | Modify | `docs/fame-swap-route-lab.md` |

**Approach:**

- Generalize the parity harness from fixed `slipstream-usdc-weth-100` to a small explicit pool selector that allows:
  - `slipstream-usdc-weth-100`
  - `uniswap-v3-usdc-weth-5bps`
- Keep default parity cases for Slipstream unchanged.
- Add Uniswap V3 default parity amount bands:
  - WETH -> USDC: small, medium, and route-relevant larger WETH amounts.
  - USDC -> WETH: small, medium, and route-relevant larger USDC amounts.
- Compare indexed replay against the live Uniswap V3 quoter at `observedThroughBlock`, not against a moving head block.
- Require exact `amountOut` equality for promotion. If exact parity fails, do not promote compact usage; treat any tolerated drift discussion as a separate future plan.
- Update route-lab indexed output so selected quote evidence can name the new source clearly, for example `indexed Uniswap V3 CL quote for uniswap-v3-usdc-weth-5bps snapshot cl-replay-v1:...`.

**Test scenarios:**

- Happy path: parity harness selects `uniswap-v3-usdc-weth-5bps` and runs both directions.
- Regression: default Slipstream parity cases and error wording remain intact.
- Validation: mismatched source registry id fails before live quoter comparison.
- Validation: stale or non-fresh replay state fails with a clear pool-specific message.
- Route-lab: indexed output includes compact quote counts, selected route indexed source, source registry id, snapshot id, observed block, and `driftBps=0` for parity proof output.
- Safety: parity error display redacts URLs, tokens, long hex, and sensitive request data.

## Expected `includeDebug: true` Evidence

For a successful indexed Uniswap V3 quote, `debug.quoteApi` should show:

- `configured: true`
- `attempted: true`
- `edgeCount` including the new Uniswap V3 edge when the route evaluates it
- `usedCount > 0` when the selected route uses the row
- `statusCounts.quoted` incremented
- a detail entry with:
  - `poolId: "uniswap-v3-usdc-weth-5bps"`
  - `quoteKind: "cl-quote-v1"`
  - `rowStatus: "quoted"`
  - `observedThroughBlock`
  - compact `evidenceId` derived from the snapshot/state identity
- selected route evidence that attributes the leg as indexed, not live

For fallback cases, `debug.quoteApi` should show:

- attempted edge identity
- `outcome: "fallback"`
- `fallbackReason` such as `unavailable_row`, `row_source_registry_mismatch`, `row_metadata_mismatch`, `row_kind_mismatch`, `row_amount_invalid`, `row_price_impact_invalid`, or `quote_api_batch_failed`
- `unavailableReason` when the producer returned an unavailable row
- no raw tick payloads, bitmap words, initialized ticks, helper URLs, service tokens, bearer headers, or backend log lines

## Deployment Ordering

1. Land and deploy `society-bots` registry/parser/indexer/quote support first.
2. Verify dev `society-bots` can index a fresh `cl-replay-v1` capsule for `uniswap-v3-usdc-weth-5bps`.
3. Verify dev `/fame/pool-quotes` returns `cl-quote-v1` for both directions and typed unavailable rows for forced stale/mismatch cases.
4. Run same-block parity against the dev helper and live Uniswap V3 quoter at `observedThroughBlock`; require exact parity for all representative amount bands.
5. Land `www` parser/adapter/handler support after the producer is live in dev.
6. Verify `www` dev with `includeDebug: true` shows compact quote attempt/use or explicit fallback for the new pool.
7. Promote `society-bots` production first, confirm fresh indexed state and compact quote rows, then promote `www` production.

## System-Wide Impact

- **Registry/source contract:** The registry source id changes when `www` promotes `uniswap-v3-usdc-weth-5bps` to replay-capable. `www` must reject rows from old source ids.
- **State storage:** CL replay latest/chunk rows must support both `slipstream-pool-state` and `uniswap-v3-pool-state` source values while preserving existing keys and chunk integrity checks.
- **Quote API:** `/fame/pool-quotes` remains the normal quote boundary for compact rows; `/fame/pool-state` remains explicit raw proof tooling.
- **Fallback posture:** Live Uniswap V3 quoter remains the safety path. Indexed compact use is opportunistic and validated per edge.
- **Observability:** `includeDebug: true` and route-lab should distinguish helper attempt, indexed row acceptance, live fallback, and parity proof.

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Full tick replay for the 5 bps pool is too dense for current Lambda budget | Keep the slice one-pool only, measure provider read count and duration in indexer metrics, and defer dense replay bounds instead of adding a second pool. |
| Uniswap V3 tick ABI differs from Slipstream tick ABI | Add a venue-specific tick reader and tests using Uniswap V3-shaped tick return values. |
| Source string generalization weakens row validation | Require venue-specific source validation in both producer tests and `www` adapter tests. |
| Registry drift causes false indexed use | Require matching `sourceRegistryId`, pool address, token order, fee metadata, tick spacing, chain id, and row source before accepting a quote. |
| Same-block parity differs from the live quoter | Do not promote; keep the edge live-fallbacking and open a follow-up for exact math differences. |
| Slipstream or reserve rows regress while generalizing CL code | Keep explicit regression tests for `slipstream-usdc-weth-100` and reserve `constant-product-quote-v1` rows in both repos. |

## Deferred Follow-Ups

- Add `uniswap-v3-usdc-weth-30bps` after the 5 bps pool proves exact parity and operational cost is acceptable.
- Add dense replay bounds, tick cursoring, or adaptive initialized-tick windows if full bitmap replay is too expensive.
- Add broader Uniswap V3 pool support only after the one-pool source/registry/parity pattern is stable.
- Consider splitting CL row source into a structured object if more venue families join and source-string validation becomes brittle.
- Build a recurring parity smoke after the manual dev proof is stable.
- Revisit exact local-math optimizer capability separately; compact quote availability does not automatically make marginal allocation locally safe.

## Sources & References

- Origin requirements: `docs/brainstorms/2026-05-23-fame-pool-api-quoter-migration-requirements.md`
- Previous compact quote plan: `docs/plans/2026-05-23-001-feat-fame-pool-api-quoter-migration-plan.md`
- `www` registry: `src/features/fame-swap/solver/poolStateRegistry.ts`
- `www` pool universe artifact: `src/features/fame-swap/artifacts/base-v1-pools.json`
- `www` quote API client: `src/features/fame-swap/solver/quotes/indexedQuoteApiClient.ts`
- `www` quote API adapter: `src/features/fame-swap/solver/quotes/indexedQuoteApiAdapter.ts`
- `www` route handler: `src/app/api/fame/swap/quote/handler.ts`
- `www` parity harness: `scripts/fame-swap-cl-replay-parity.ts`
- `www` route-lab tooling: `scripts/fame-swap-route-lab.ts`
- `society-bots` registry parser: `src/fame-swap-pool-state/registry/index.ts`
- `society-bots` registry artifact: `src/fame-swap-pool-state/registry/base-v1-pools.json`
- `society-bots` indexer: `src/fame-swap-pool-state/indexer.ts`
- `society-bots` CL replay storage: `src/fame-swap-pool-state/dynamodb/pool-state.ts`
- `society-bots` compact quote producer: `src/fame-swap-pool-state/cl-quote.ts`
