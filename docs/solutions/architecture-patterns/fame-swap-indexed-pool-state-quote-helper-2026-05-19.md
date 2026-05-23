---
title: FAME Swap Indexed Pool-State Quote Helper
date: 2026-05-19
last_updated: 2026-05-22
category: architecture-patterns
module: fame-swap
problem_type: architecture_pattern
component: service_object
severity: high
applies_when:
  - Adding an indexed liquidity-state helper to a quote API that must remain correct under stale or mismatched data.
  - Replaying reviewed constant-product reserves locally while preserving live quote fallback behavior.
  - Introducing one replayable concentrated-liquidity pool while live quotes remain authoritative.
  - Debugging why a helper API authenticates successfully but selected quote context is still live or recorded.
  - Moving from raw `cl-replay-v1` tick payloads to backend-owned exact-input quote responses.
related_components:
  - quote API
  - pool-state registry
  - indexed reserve adapter
  - indexed CL replay adapter
  - route lab
  - testing framework
  - society-bots
tags: [fame-swap, pool-state, indexed-quoter, quote-api, live-fallback, provenance, route-lab, doppler]
---

# FAME Swap Indexed Pool-State Quote Helper

## Context

FAME swap quoting had already moved away from deterministic caps toward live and recorded quote evidence. Earlier sessions added live adapters, recorded Base route-lab replay, constant-product reserve replay for vetted pool classes, quote API hardening, bounded candidate work, and route-lab evidence. Those sessions also found that backend quote optimization needs a state boundary below the adapter layer: TanStack can cache app queries, but it does not coalesce backend `readContract` calls inside a quote run (session history).

Commit `8205fb1 feat(fame): add indexed pool-state quoting` added that first indexed boundary. `www` can now call the `society-bots` FAME pool-state helper, request reviewed pool rows for the current quote block, replay fresh constant-product reserves locally, and fall back when indexed state is not trustworthy.

The one-pool CL replay vertical slice kept that boundary but made `slipstream-usdc-weth-100` the first replayable concentrated-liquidity candidate. `society-bots` can now publish raw `cl-replay-v1` state for that one pool: slot0, active liquidity, dynamic fee, block identity, initialized tick bitmap words, initialized tick liquidity rows, chunk counts, and state hash.

The hardening pass made the proof surface production-safer: CL replay snapshot failures now throw from the indexer Lambda instead of remaining INFO-only success logs; the snapshot id includes `sourceRegistryId` so same-block rejected writes cannot poison another registry's chunks; bitmap/tick chunks get DynamoDB TTL through `expiresAt`; stale replay API responses return metadata only; schema v3 requires explicit `replaySurface` fields; and `sourceRegistryId` includes the registry schema version.

Live same-block parity proved the math at block `46352078`: `bitmapWords=15`, `initializedTicks=307`, and zero drift for representative WETH-to-USDC and USDC-to-WETH exact-input amounts. That proves local replay can match the Slipstream quoter for the indexed pool at a fixed block.

The next design pivot is wire-shape, not math capability. The raw tick payload is useful for proof, parity, and debug, but it is chunky. Normal `www` quote flow should move toward a backend-owned exact-input CL quote response from `society-bots`, while raw replay state remains gated behind explicit debug/admin/parity access.

The important learning is operational as much as architectural: helper reachability is not proof of indexed quoting. A helper can return `200` with valid auth while `www` still selects live or recorded quote context because rows are stale, observed ahead of `www`'s current block, unsupported, malformed, or from a mismatched registry.

## Guidance

Treat indexed pool-state as an attributed optimization layer, not as the source of truth.

The server quote path enables the helper only from server-only environment variables:

- `FAME_POOL_STATE_API_URL`
- `FAME_POOL_STATE_SERVICE_TOKEN`
- optional `FAME_POOL_STATE_TIMEOUT_MS`
- optional `FAME_POOL_STATE_MAX_FRESHNESS_BLOCKS`

Those variables are read in `src/app/api/fame/swap/quote/handler.ts`. Do not add `NEXT_PUBLIC_` variants; the helper URL and service token belong on the server side.

The quote API builds a live or fork adapter first, then wraps that adapter only when it has a block-bearing quote context. The wrapper sends the helper:

- `currentBlock` from the live/fork quote context
- reviewed pool ids for the requested pair
- explicit replay-state opt-in through `stateSurfaces: ["cl-replay-v1"]` when shadow CL replay evidence is wanted
- optional max freshness

This keeps freshness checks tied to the same block context that produced the quote.

As of the `codex/slipstream-cl-replay-snapshot-proof-www` companion branch, route lab has enough to request `cl-replay-v1`, parse the full replay payload, summarize the replay snapshot, and exercise the local math adapter in shadow mode. It does not yet avoid the raw tick payload, and it does not yet consume a backend-owned CL quote endpoint. In indexed route-lab mode, `createIndexedClReplayQuoteAdapter` runs with `mode: "shadow"`, so the selected quote still comes from the reserve/live fallback while local CL replay is exercised as evidence.

The parity harness is stronger than route lab for CL proof. `scripts/fame-swap-cl-replay-parity.ts` fetches fresh `cl-replay-v1` state, pins the live adapter to the snapshot's `observedThroughBlock`, runs `quoteFromIndexedSlipstreamReplay`, and fails on any `amountOut` mismatch even if rounded basis-point drift is zero.

Validate provenance before trusting helper rows. `src/features/fame-swap/solver/poolStateRegistry.ts` derives the local registry and `sourceRegistryId` from generated `www` route/pool artifacts. `src/app/api/fame/swap/quote/handler.ts` falls back when the helper response `sourceRegistryId` differs, and `src/features/fame-swap/solver/quotes/indexedReserveAdapter.ts` also requires address-backed pools to match the returned `poolAddress` before replaying reserves.

Replay only fresh, model-compatible rows. `src/features/fame-swap/solver/quotes/indexedPoolStateClient.ts` parses the helper wire response; `indexedReserveAdapter.ts` replays rows with `status: "fresh"` and `quoteModel: "constant-product-reserves"`. Stale, unknown, unsupported, malformed, mismatched, or exceptioning rows delegate to the fallback adapter.

For CL replay, parse and validate `stateKind: "cl-replay-v1"` as a distinct state surface. The indexed CL replay adapter accepts only fresh `slipstream-usdc-weth-100` state with matching registry provenance, pool address, token order, dynamic fee, and complete tick records. Missing state, stale or future-block state, malformed decimals or bitmap words, unsupported pools, token-direction mismatch, outside-range replay, replay exceptions, and parity mismatches all keep the request on the live fallback path.

Keep the ownership line crisp, but let it evolve. The proof slice made `society-bots` the replayable market-state producer and `www` the shadow math/parity consumer. The next production-safe slice should make `society-bots` own exact-input quote execution for this one indexed pool so `www` does not need raw ticks in the hot path. `www` should still own route ranking, route attribution, quote safety, slippage, public readiness, and live-quoter fallback.

Quote attribution must be per selected leg, not per adapter. `src/features/fame-swap/solver/quotes/rankRoutes.ts` now reports route-level indexed context only when all selected legs share the same indexed context. Mixed indexed/live fallback routes should not claim a fully indexed quote. `src/features/fame-swap/solver/quoteWire.ts` preserves the public indexed context fields without leaking helper credentials or protocol evidence.

Keep helper failure visible without breaking fallback. The API logs a sanitized `fame-pool-state-helper-unavailable` event on helper auth/network/schema/provenance failure. It does not log service tokens, credentialed URLs, raw request bodies, or raw upstream errors. In `society-bots`, CL replay capture failures must remain error-level operational failures, not INFO-only metrics, because bad replay snapshots are the correctness boundary for every downstream quote.

## Why This Matters

This pattern lets `www` reduce hot-path reserve reads while keeping the public quote API correct. The indexed helper can speed up constant-product reserve replay, but the executable quote boundary still needs to reject stale or mismatched state.

The fallback behavior is intentionally quiet from the user perspective: a quote can remain `ready` even when the helper was unavailable. That is correct for UX and safety, but it makes diagnosis easy to misread. Debug `quoteContext.source` and indexed status counts, not just helper reachability.

For concentrated liquidity, saving ticks is what turns an indexed head snapshot into locally replayable state. Slot0 plus current liquidity can explain the current price, but an exact-input swap may cross initialized ticks. Once the full bitmap and tick liquidity deltas are available at the same block, `www` can locally reproduce the same state transition that the Slipstream quoter would execute in an `eth_call`. Until exact same-block parity is proven, this is diagnostic/shadow evidence only.

The Doppler smoke test made this concrete:

- Raw Doppler env had the helper URL and token present.
- A direct helper request authenticated and returned pool rows.
- A WETH-to-FAME API smoke returned `200 ready`.
- With raw freshness settings, the quote context was `live`.
- With a local `FAME_POOL_STATE_MAX_FRESHNESS_BLOCKS=120` and `FAME_POOL_STATE_TIMEOUT_MS=5000` override, the same direct-pool quote returned `quoteContext.source: "indexed"` with fresh rows.

The reason was block/freshness skew. The helper row could be observed a few blocks ahead of the `www` current block, so the helper correctly marked it unusable for that quote block. Align `BASE_RPC_URL` between `www` and the indexer, and use a realistic dev freshness window before assuming the integration is broken.

This also continues earlier quote-builder lessons (session history):

- deterministic caps are test-only; production evidence should be live, recorded, simulated, or explicitly indexed
- V4 after-price should not be fabricated when the quoter does not return it
- request-scoped state caching belongs below or inside quote adapters, where repeated allocation trials reuse the same pool state
- route-lab should prove selected/rejected routes without leaking RPC URLs, calldata, signer material, or helper secrets

## When to Apply

- Adding or debugging FAME quote paths that mix helper-indexed state with live adapters.
- Route-lab `--indexed` returns ready quotes, but `quoteContext` is `live` or `recorded`.
- Helper auth and URL checks pass, but indexed status counts show stale or unknown rows.
- `observedThroughBlock` is ahead of, or too far behind, the `www` quote block.
- `society-bots` and `www` may be using different Base RPC providers or different block views.
- Expanding the solver toward allocation optimization where many quote trials reuse the same reserves, slot0, liquidity, or quoter state.

## Current State and TODO Triage

Route lab readiness:

- `www` route lab can request `stateSurfaces: ["cl-replay-v1"]`, summarize the replay snapshot, and run the CL replay adapter in shadow mode.
- The selected route-lab quote is still served by fallback quote evidence in shadow mode; route lab is not yet a production CL indexed quote path.
- The parity harness is the current promotion-grade proof for local CL math because it compares local replay against the live Slipstream quoter pinned to the same snapshot block.

Local math state:

- `quoteFromIndexedSlipstreamReplay` can execute exact-input Slipstream replay from full tick state.
- `createIndexedClReplayQuoteAdapter` has `mode: "local" | "shadow"`; route lab uses `shadow`.
- Exact replay capability is not the same as `local_math` optimizer eligibility. The allocator still needs a dedicated marginal/route-level integration before CL replay should be treated as general local quote capacity.

Must do before the next dev deploy:

- Verify the dev indexer emits `clReplaySnapshots: 1`, `clReplayWrittenPools: 1`, `clReplayFailedPools: 0`, and no swallowed replay failures.
- Verify the dev API returns `pool-state-registry-v3:...` and stale replay responses do not include `bitmapWords` or `initializedTicks`.

Must do before production use of CL replay quotes:

- Stop sending raw bitmap/tick arrays to `www` for normal quote flow.
- Add a `society-bots` exact-input CL quote surface for `slipstream-usdc-weth-100`, returning compact quote evidence: pool id, direction, amount in/out, observed block, block hash, snapshot id, state hash, fee, freshness, and a typed fallback reason when unavailable.
- Keep raw replay state behind explicit debug/admin/parity access. Do not make route-lab or the public quote API depend on full ticks by default.
- Keep `www` live-quoter fallback for stale, incomplete, outside-range, registry-mismatched, parity-failing, or unavailable indexed quote responses.
- Decide whether the quote surface is a new endpoint or a new state surface such as `cl-quote-v1`; bump the registry/source contract if the wire shape changes incompatibly.

Follow-up soon:

- Teach route lab to exercise the backend CL quote surface and report quote attribution separately from raw replay parity.
- Add route-level telemetry that separates helper reachability, indexed reserve replay, CL quote response, shadow CL replay, and live fallback.
- Add quote heatmap and historical liquidity/price chart jobs only after the one-pool quote surface is stable.
- Extract shared Slipstream math only after `society-bots` and `www` agree on the one-pool quote contract; do not start with a broad package migration.
- Track payload size for raw replay responses and keep it out of normal UI/server quote paths.

Intentionally out of scope for this slice:

- Multi-pool CL replay coverage.
- Event-driven tick maintenance as the first implementation path.
- Route ranking inside `society-bots`.
- Public claims that FAME quotes are indexed CL quotes before selected-route attribution proves it.

## Examples

Server env for `www`:

```bash
FAME_POOL_STATE_API_URL=https://.../fame/pool-state
FAME_POOL_STATE_SERVICE_TOKEN=...
FAME_POOL_STATE_MAX_FRESHNESS_BLOCKS=120
FAME_POOL_STATE_TIMEOUT_MS=5000
BASE_RPC_URL=https://...
```

For production, tune freshness and timeout from observed helper latency and indexer cadence. In dev, `120` blocks and `5000` ms proved the helper path without confusing cold starts or block skew with logic failure.

Run indexed route-lab against a real current block:

```bash
BASE_RPC_URL=https://... \
FAME_POOL_STATE_API_URL=https://.../fame/pool-state \
FAME_POOL_STATE_SERVICE_TOKEN=... \
FAME_POOL_STATE_MAX_FRESHNESS_BLOCKS=120 \
FAME_POOL_STATE_TIMEOUT_MS=5000 \
bun scripts/fame-swap-route-lab.ts --indexed --markdown
```

Run same-block Slipstream CL replay parity:

```bash
BASE_RPC_URL=https://... \
FAME_POOL_STATE_API_URL=https://.../fame/pool-state \
FAME_POOL_STATE_SERVICE_TOKEN=... \
FAME_POOL_STATE_MAX_FRESHNESS_BLOCKS=120 \
bun scripts/fame-swap-cl-replay-parity.ts
```

Recent successful live parity proof:

```text
snapshot=cl-replay-v1:slipstream-usdc-weth-100:46352078:...:pool-state-registry-v3:...
block=46352078 stateHash=0x5445114ed0b4c8adc9a65c3110ee13a6ac888f0a2fd963fa21bfdfd3277e3880 bitmapWords=15 initializedTicks=307
WETH->USDC 100000000000000 local=207063 live=207063 driftBps=0
WETH->USDC 1000000000000000 local=2070634 live=2070634 driftBps=0
WETH->USDC 10000000000000000 local=20706343 live=20706343 driftBps=0
USDC->WETH 1000000 local=482532341647236 live=482532341647236 driftBps=0
USDC->WETH 10000000 local=4825323175636440 live=4825323175636440 driftBps=0
USDC->WETH 100000000 local=48253207672784937 live=48253207672784937 driftBps=0
```

Expected proof is not "the helper returned 200." Expected proof is selected quote attribution:

```json
{
  "quoteContext": {
    "source": "indexed",
    "chainId": 8453,
    "currentBlock": 46206269,
    "effectiveMaxFreshnessBlocks": 120,
    "statusCounts": {
      "fresh": 7,
      "stale": 0,
      "unknown": 0,
      "unsupported": 9
    }
  },
  "poolIds": ["uniswap-v2-fame-direct"]
}
```

If the public quote is still live, query the helper directly for one selected pool and compare:

```json
{
  "currentBlock": 46206306,
  "producerMaxFreshnessBlocks": 120,
  "effectiveMaxFreshnessBlocks": 25,
  "pools": [
    {
      "poolId": "uniswap-v2-fame-direct",
      "status": "stale",
      "observedThroughBlock": 46206308
    }
  ]
}
```

Here `observedThroughBlock` is two blocks ahead of `currentBlock`, so falling back live is the correct behavior.

Regression coverage should include:

- registry/source mismatch falls back and logs a sanitized helper-unavailable event
- address-backed pool mismatch falls back
- helper auth/network/schema failures fall back without leaking tokens or full upstream errors
- all-indexed selected routes report indexed context
- mixed indexed/live routes do not report route-level indexed context
- indexed route-lab requires a real current block source
- indexed route-lab requests `cl-replay-v1` and reports the replay snapshot summary without claiming served CL quotes are indexed
- CL replay parser preserves bitmap and tick data exactly
- stale CL replay parser accepts metadata-only responses without `bitmapWords` or `initializedTicks`
- CL replay adapter serves fallback in shadow mode and local quotes only under explicit local mode
- CL replay parity harness rejects any non-identical `amountOut`, even when rounded bps drift is zero
- stale rows parse at the client boundary and fall back at quote replay
- quote wire tests preserve all indexed context fields
- backend replay snapshot failures throw operational errors and surface in Lambda errors/DLQ/alarms
- backend same-block rejected writes cannot publish chunks under the wrong registry
- backend replay chunk rows have TTL while latest pointer rows remain durable
- backend API loads heavy replay chunks only for fresh matching latest pointers
- backend quote endpoint tests compare compact indexed CL quotes against the live quoter at the same block before `www` uses them

## Related

- `docs/solutions/performance-issues/fame-swap-quote-solver-timeouts-native-wrap-routing-2026-05-15.md` covers the adjacent optimizer/native-wrap timeout work. Overlap is moderate, but this document is about the indexed state boundary and freshness/provenance contract.
- `docs/plans/2026-05-17-001-feat-society-bots-fame-pool-state-plan.md` is the implementation plan for the cross-repo pool-state helper.
- `docs/brainstorms/2026-05-17-society-bots-fame-pool-liquidity-modeling-requirements.md` captures the requirements that led to this slice.
- `docs/fame-swap-route-lab.md` documents operational route-lab modes, including indexed mode.
- `society-bots` branch `codex/slipstream-cl-replay-snapshot-proof` contains the first replayable one-pool backend slice and hardening commit `02e3e5e fix(fame): harden CL replay indexing`.
- `src/app/api/fame/swap/quote/route.test.ts`, `src/features/fame-swap/solver/quotes/indexedReserveAdapter.test.ts`, `src/features/fame-swap/solver/quotes/indexedClReplayAdapter.test.ts`, `src/features/fame-swap/solver/quotes/indexedPoolStateClient.test.ts`, `scripts/fame-swap-route-lab.test.ts`, `scripts/fame-swap-cl-replay-parity.test.ts`, and `src/features/fame-swap/solver/quoteWire.test.ts` are the most useful regression tests for this pattern.
