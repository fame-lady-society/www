---
title: FAME Swap Indexed Pool-State Quote Helper
date: 2026-05-19
category: architecture-patterns
module: fame-swap
problem_type: architecture_pattern
component: service_object
severity: high
applies_when:
  - Adding an indexed liquidity-state helper to a quote API that must remain correct under stale or mismatched data.
  - Replaying reviewed constant-product reserves locally while preserving live quote fallback behavior.
  - Debugging why a helper API authenticates successfully but selected quote context is still live or recorded.
related_components:
  - quote API
  - pool-state registry
  - indexed reserve adapter
  - route lab
  - testing framework
  - society-bots
tags: [fame-swap, pool-state, indexed-quoter, quote-api, live-fallback, provenance, route-lab, doppler]
---

# FAME Swap Indexed Pool-State Quote Helper

## Context

FAME swap quoting had already moved away from deterministic caps toward live and recorded quote evidence. Earlier sessions added live adapters, recorded Base route-lab replay, constant-product reserve replay for vetted pool classes, quote API hardening, bounded candidate work, and route-lab evidence. Those sessions also found that backend quote optimization needs a state boundary below the adapter layer: TanStack can cache app queries, but it does not coalesce backend `readContract` calls inside a quote run (session history).

Commit `8205fb1 feat(fame): add indexed pool-state quoting` added that first indexed boundary. `www` can now call the `society-bots` FAME pool-state helper, request reviewed pool rows for the current quote block, replay fresh constant-product reserves locally, and fall back when indexed state is not trustworthy.

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
- optional max freshness

This keeps freshness checks tied to the same block context that produced the quote.

Validate provenance before trusting helper rows. `src/features/fame-swap/solver/poolStateRegistry.ts` derives the local registry and `sourceRegistryId` from generated `www` route/pool artifacts. `src/app/api/fame/swap/quote/handler.ts` falls back when the helper response `sourceRegistryId` differs, and `src/features/fame-swap/solver/quotes/indexedReserveAdapter.ts` also requires address-backed pools to match the returned `poolAddress` before replaying reserves.

Replay only fresh, model-compatible rows. `src/features/fame-swap/solver/quotes/indexedPoolStateClient.ts` parses the helper wire response; `indexedReserveAdapter.ts` replays rows with `status: "fresh"` and `quoteModel: "constant-product-reserves"`. Stale, unknown, unsupported, malformed, mismatched, or exceptioning rows delegate to the fallback adapter.

Quote attribution must be per selected leg, not per adapter. `src/features/fame-swap/solver/quotes/rankRoutes.ts` now reports route-level indexed context only when all selected legs share the same indexed context. Mixed indexed/live fallback routes should not claim a fully indexed quote. `src/features/fame-swap/solver/quoteWire.ts` preserves the public indexed context fields without leaking helper credentials or protocol evidence.

Keep helper failure visible without breaking fallback. The API logs a sanitized `fame-pool-state-helper-unavailable` event on helper auth/network/schema/provenance failure. It does not log service tokens, credentialed URLs, raw request bodies, or raw upstream errors.

## Why This Matters

This pattern lets `www` reduce hot-path reserve reads while keeping the public quote API correct. The indexed helper can speed up constant-product reserve replay, but the executable quote boundary still needs to reject stale or mismatched state.

The fallback behavior is intentionally quiet from the user perspective: a quote can remain `ready` even when the helper was unavailable. That is correct for UX and safety, but it makes diagnosis easy to misread. Debug `quoteContext.source` and indexed status counts, not just helper reachability.

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
- stale rows parse at the client boundary and fall back at quote replay
- quote wire tests preserve all indexed context fields

## Related

- `docs/solutions/performance-issues/fame-swap-quote-solver-timeouts-native-wrap-routing-2026-05-15.md` covers the adjacent optimizer/native-wrap timeout work. Overlap is moderate, but this document is about the indexed state boundary and freshness/provenance contract.
- `docs/plans/2026-05-17-001-feat-society-bots-fame-pool-state-plan.md` is the implementation plan for the cross-repo pool-state helper.
- `docs/brainstorms/2026-05-17-society-bots-fame-pool-liquidity-modeling-requirements.md` captures the requirements that led to this slice.
- `docs/fame-swap-route-lab.md` documents operational route-lab modes, including indexed mode.
- `src/app/api/fame/swap/quote/route.test.ts`, `src/features/fame-swap/solver/quotes/indexedReserveAdapter.test.ts`, `src/features/fame-swap/solver/quotes/indexedPoolStateClient.test.ts`, and `src/features/fame-swap/solver/quoteWire.test.ts` are the most useful regression tests for this pattern.
