---
date: 2026-05-23
topic: fame-pool-api-quoter-migration
focus: migrate www to FAME_POOL_API_URL and consume compact /fame/pool-quotes
mode: repo-grounded
---

# Ideation: FAME Pool API Quoter Migration

## Grounding Context

- `www` normal quote handling still has separate `FAME_POOL_STATE_API_URL` and `FAME_POOL_QUOTE_API_URL` wiring.
- There are no current `FAME_POOL_API_URL` references in the repo.
- `maybeWrapIndexedQuoteAdapter` fetches raw indexed pool-state before compact CL quote wrapping.
- `indexedClQuoteClient` posts `cl-quote-v1` requests to `/fame/pool-quotes`, but defaults to a 750ms timeout and reuses `FAME_POOL_STATE_TIMEOUT_MS`.
- `indexedClQuoteAdapter` is already narrow to `slipstream-usdc-weth-100` and falls back live on helper failure, provenance mismatch, no matching quote, or unusable quote data.
- Quote debug output is still `indexedPoolState`-named; compact quote attempts are not separately visible.
- Route-lab and parity scripts still use raw `/fame/pool-state` for `cl-replay-v1` proof.
- External grounding supports bounded synchronous helper calls, layered timeouts, cold-start-aware budgets, and avoiding async job/polling for interactive swap quotes.

## Topic Axes

- Env/API boundary
- Normal quote execution
- Timeout/cold-start budget
- Observability/proof
- Route-lab/debug retention

## Ranked Ideas

### 1. Make `FAME_POOL_API_URL` the only normal quote helper base

**Description:** Replace split normal-path env resolution with one server-only base URL and derive `/fame/pool-quotes` for the compact helper. Keep raw `/fame/pool-state` out of the app quote handler; reserve it for explicit proof/debug tooling if still needed.
**Axis:** Env/API boundary
**Basis:** `direct:` `handler.ts` still reads `FAME_POOL_STATE_API_URL` and `FAME_POOL_QUOTE_API_URL` separately; the user explicitly created `FAME_POOL_API_URL` and asked to standardize on it.
**Rationale:** This makes the production boundary match the desired authority model: `society-bots` exposes quotes, `www` consumes quotes, and raw replay state is not a normal quote-path dependency.
**Downsides:** Requires coordinated env, docs, and test updates, plus clear path derivation to avoid accidental slash/path bugs.
**Confidence:** 95%
**Complexity:** Low
**Status:** Unexplored

### 2. Make the public adapter chain compact-only, with live fallback underneath

**Description:** In normal `/api/fame/swap/quote` execution, stop constructing or fetching raw indexed pool-state before compact CL quote wrapping. The compact adapter should sit directly over the live/fork fallback; stale, unavailable, mismatched, outside-range, or unusable compact quotes continue to use live fallback.
**Axis:** Normal quote execution
**Basis:** `direct:` `maybeWrapIndexedQuoteAdapter` currently fetches raw pool-state before calling `createIndexedClQuoteAdapter`; the user wants no normal pool-state calls in `www`.
**Rationale:** This is the behavioral migration, not just an env rename.
**Downsides:** Drops the reserve indexed-state optimization from the normal quote path unless a separate explicit mode keeps it.
**Confidence:** 92%
**Complexity:** Medium
**Status:** Unexplored

### 3. Split and raise the compact quote timeout budget

**Description:** Add compact-quote-specific timeout configuration, likely `FAME_POOL_QUOTE_TIMEOUT_MS` with a default around 2500ms, capped by remaining request budget. Do not reuse `FAME_POOL_STATE_TIMEOUT_MS` for compact quotes.
**Axis:** Timeout/cold-start budget
**Basis:** `direct:` `indexedClQuoteClient` currently defaults to 750ms and `handler.ts` passes `FAME_POOL_STATE_TIMEOUT_MS`; `external:` AWS Lambda cold starts can include runtime and static initialization that may exceed sub-second budgets.
**Rationale:** A 750ms cutoff can make the first cold helper request look broken even when the endpoint is fine. A separate budget gives the quoter a realistic chance without letting it consume the whole API request.
**Downsides:** Slow cold requests may increase quote latency when live fallback would have been faster.
**Confidence:** 88%
**Complexity:** Low-Medium
**Status:** Unexplored

### 4. Add compact-specific fallback/debug evidence

**Description:** Add `debug.indexedClQuote` and sanitized logs for configured, attempted, used, fallback reason, status counts, helper failure class, source mismatch, no matching quote, unusable quote, selected snapshot identity, and compact helper timing.
**Axis:** Observability/proof
**Basis:** `direct:` the compact adapter catches helper failures and falls back without compact-specific debug; the handler only returns `indexedPoolState` debug today.
**Rationale:** Live fallback stays safe, but operators need to know whether compact quotes are being used or silently missed.
**Downsides:** Needs careful log hygiene so secrets, credentialed URLs, and raw payloads do not leak.
**Confidence:** 90%
**Complexity:** Medium
**Status:** Unexplored

### 5. Harden the one-pool compact correctness gate

**Description:** Keep `slipstream-usdc-weth-100` as the only compact-enabled pool, enforce requested `maxFreshnessBlocks` in the compact client, and keep source registry and metadata matching before accepting a `cl-quote-v1` row.
**Axis:** Normal quote execution
**Basis:** `direct:` `indexedClQuoteAdapter` already allowlists `slipstream-usdc-weth-100`; `indexedClQuoteClient` validates freshness from response caps but not the caller cap strongly enough.
**Rationale:** This preserves the narrow, correctness-first rollout while removing raw replay from the hot path.
**Downsides:** May reject usable backend quotes more often until freshness semantics are fully aligned.
**Confidence:** 87%
**Complexity:** Low-Medium
**Status:** Unexplored

### 6. Split proof tooling into compact smoke and raw replay debug

**Description:** Add route-lab or smoke coverage that exercises `/fame/pool-quotes` via `FAME_POOL_API_URL` and compares same-block compact output against the live Slipstream quoter. Keep raw `cl-replay-v1` access in route-lab/parity as an explicit debug/proof exception, not a normal quote dependency.
**Axis:** Route-lab/debug retention
**Basis:** `direct:` route-lab/parity currently require `FAME_POOL_STATE_API_URL` for raw replay; prior proof work needs same-block compact/live evidence before promotion.
**Rationale:** The proof should match the production surface while preserving deeper forensic tools.
**Downsides:** Adds one more script/test mode, and live dev smoke depends on Doppler/RPC availability.
**Confidence:** 85%
**Complexity:** Medium
**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Keep `FAME_POOL_QUOTE_API_URL` as the hot-path gate | Conflicts with the requested `FAME_POOL_API_URL` standardization. |
| 2 | Retain or tighten the 750ms compact timeout | Under-addresses the cold Lambda concern; keep fallback but give cold starts a realistic budget. |
| 3 | Concurrent live/compact race | Interesting, but too much complexity for this slice and may duplicate expensive quote work. |
| 4 | Import-boundary-only raw state enclave | Good guardrail, but mostly an implementation detail of the stronger compact-only public adapter chain. |
| 5 | Timing buckets for every quote phase | Useful later; merged into compact-specific fallback/debug evidence for this pass. |
| 6 | Backend async job/polling pattern | Wrong shape for interactive swap quotes; useful only for non-interactive reports or audits. |
| 7 | Broad compact quote surface or multi-pool support | Scope overrun; one-pool `slipstream-usdc-weth-100` remains the safe production milestone. |
