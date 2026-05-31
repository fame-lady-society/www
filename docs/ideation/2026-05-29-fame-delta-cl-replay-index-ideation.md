---
date: 2026-05-29
topic: fame-delta-cl-replay-index
focus: delta-maintained CL replay index for the current www and society-bots FAME quote branches
mode: repo-grounded
---

# Ideation: FAME Delta CL Replay Index

## Grounding Context

The active `www` and `society-bots` branches are both `codex/fame-cl-quote-surface`. The current branch pair has moved the hot quote boundary to compact `/fame/pool-quotes` rows: `society-bots` produces compact reserve and CL quote rows, while `www` validates row identity/provenance, converts accepted rows into quote results, and falls back live whenever helper output is unavailable, stale, mismatched, invalid, or slow.

The serious cost change is concentrated in the replay maintenance model, not the consumer. `society-bots` currently runs the pool-state indexer on a one-minute EventBridge schedule by default. The registry has exactly two `cl-replay-v1` pools: `slipstream-usdc-weth-100` and `uniswap-v3-usdc-weth-5bps`. On every indexer run, `indexFamePoolStates` calls `getClReplaySnapshot` for every replay pool. That snapshot path reads block identity, slot0, active liquidity, fee, every tick bitmap word across the supported tick range, and every initialized tick for each replay pool. The code already records `providerReadCount`, `durationMs`, bitmap counts, tick counts, and state hashes in replay metrics, which gives this effort a concrete proof surface.

The existing storage/publication shape is useful. `putLatestClReplayState` writes bitmap/tick chunks first, then publishes the latest replay pointer, so the API should not expose partial snapshots as fresh. `/fame/pool-quotes` reads fresh replay pointers and chunks, computes compact `cl-quote-v1` rows, and returns precise unavailable reasons for missing, stale, mismatched, malformed, outside-range, or failed replay state. `www` already has compact quote diagnostics and live fallback, so the consumer side is ready for stricter maintenance-state signals rather than a new quote architecture.

Prior ideation intentionally chose full snapshots to prove parity before event-driven maintenance. That was correct for the proof rung, but the deployed cost signal changes the next move: full snapshots should remain as checkpoint/audit machinery, not as the minute-by-minute maintenance algorithm.

External grounding supports the same shape. Uniswap's V3 pool-data guide says offchain modeling needs liquidity, slot0, and full tick data, and it explicitly notes that fetching all initialized ticks can be expensive or slow through normal RPC. The Uniswap V3 pool event interface exposes reducer-friendly data: `Mint`/`Burn` identify tick ranges and liquidity amounts, while `Swap` includes post-swap sqrt price, liquidity, and tick. Base's `eth_getLogs` docs describe log filtering as useful for indexing and recommend bounded block ranges for reliability.

Relevant sources:

- Uniswap V3 pool data guide: https://developers.uniswap.org/docs/sdks/v3/guides/pool-data
- Uniswap V3 pool events: https://github.com/Uniswap/v3-core/blob/main/contracts/interfaces/pool/IUniswapV3PoolEvents.sol
- Base `eth_getLogs`: https://docs.base.org/base-chain/api-reference/ethereum-json-rpc-api/eth_getLogs

## Topic Axes

- Event ingestion and reducer semantics
- Snapshot and drift reconciliation
- Storage and cursor contract
- Quote/API consumption and safety
- Observability and rollout economics

## Ranked Ideas

### 1. Snapshot-Seeded Delta CL Replay Reducer

**Description:** Keep the existing full `cl-replay-v1` capsule as the seed, then maintain it by scanning pool logs from the last replay cursor and applying CL deltas. A normal scheduled wake should scan bounded `Mint`, `Burn`, and `Swap` logs for the two replay pools, apply changes to the latest capsule, and advance the replay cursor without rereading every bitmap word and initialized tick. Full bitmap/tick reads become seed or repair operations, not the steady-state algorithm.

**Axis:** Event ingestion and reducer semantics

**Basis:** `direct:` `indexFamePoolStates` currently calls `getClReplaySnapshot` for every replay pool on every scheduled run, and `getConcentratedLiquidityClReplaySnapshot` reads block identity, slot0, liquidity, fee, every bitmap word, and every initialized tick. `external:` Base documents `eth_getLogs` as an indexing primitive, and Uniswap V3 events expose the fields needed to update head state and tick liquidity deltas.

**Rationale:** This directly attacks the burn source. Quiet or low-activity minutes should not spend full snapshot RPCs; they should spend a bounded log scan and small Dynamo updates, then serve the same compact quote contract when fresh.

**Downsides:** Reducers are easier to get subtly wrong than snapshots. The first pass must be shadowed against snapshot hashes before compact rows are trusted.

**Confidence:** 92%

**Complexity:** High

**Status:** Unexplored

### 2. Immediate Full-Snapshot Cadence Brake

**Description:** Add a short-term safety valve that stops minute-by-minute full CL replay capture while delta maintenance is being built. Keep reserve indexing and CL head snapshots on the fast schedule, but run full replay snapshots only on a slower cadence such as daily, manually, or behind an explicit maintenance mode. Compact CL rows can become unavailable during this interim if freshness cannot be maintained cheaply.

**Axis:** Snapshot and drift reconciliation

**Basis:** `direct:` CDK defaults the pool-state schedule to once per minute, docs say the indexer captures full replay snapshots for exactly two pools, and the user observed the daily RPC bill jump from cents to dollars after CL replay and quoting were added.

**Rationale:** This is the quickest way to stop the unhealthy burn without pretending the delta reducer is already done. It preserves correctness by leaning on existing `www` live fallback rather than serving stale indexed quotes.

**Downsides:** Indexed CL quote usage may drop until the reducer exists. Product latency regresses to live fallback for those edges during the brake.

**Confidence:** 89%

**Complexity:** Low-Medium

**Status:** Unexplored

### 3. Daily Drift Oracle And Fail-Closed Repair

**Description:** Keep full snapshots as a low-cadence integrity oracle. Once per day, or on explicit operator demand, capture a full safe-block snapshot and compare its deterministic state hash against the delta-maintained state at the same block. If the hashes differ, publish a drift status, mark compact CL quotes unavailable, write a bounded debug bundle, and repair the latest capsule from the full snapshot.

**Axis:** Snapshot and drift reconciliation

**Basis:** `direct:` replay rows already carry `snapshotId`, `stateHash`, block hash, parent hash, bitmap counts, tick counts, and registry provenance. `reasoned:` the full snapshot path is expensive but valuable as an audit checkpoint; demoting it to a drift oracle keeps the proof value while removing the per-wake cost.

**Rationale:** This keeps the previous parity work instead of throwing it away. The architecture becomes checkpoint plus log replay, like a database maintaining pages from a write-ahead log with periodic checkpoints.

**Downsides:** Same-block comparison needs careful orchestration. If the daily check frequently repairs drift, the reducer is not production-ready.

**Confidence:** 90%

**Complexity:** Medium-High

**Status:** Unexplored

### 4. `cl-replay-maintenance-v1` Cursor And Journal

**Description:** Add a compact maintenance row per replay pool that records the delta cursor, last applied block/hash/log position, latest state hash, last full checkpoint block/hash, drift status, repair status, and source registry id. Optionally retain short-TTL `cl-replay-delta-v1` journal rows for recently applied log cohorts so drift investigations can replay the last window without scraping CloudWatch.

**Axis:** Storage and cursor contract

**Basis:** `direct:` reserve indexing already uses sorted logs, monotonic writes, and a cursor; CL replay currently publishes latest snapshot rows but has no independent event cursor. `reasoned:` a reducer without cursor and recent-delta evidence is hard to repair or audit when snapshot comparison fails.

**Rationale:** This gives the delta lane its own lifecycle instead of piggybacking on reserve cursor semantics. It also gives `/fame/pool-quotes`, route-lab, and operators one place to decide whether replay state is fresh, drift-clean, warming, or repairing.

**Downsides:** Adds a new internal state contract and more Dynamo writes. The journal must be short-lived and bounded so it does not become an accidental analytics store.

**Confidence:** 87%

**Complexity:** Medium

**Status:** Unexplored

### 5. Normalized Slipstream/V3 Event Reducer Contract

**Description:** Define a small normalized internal event stream for replay maintenance: `swap`, `mint`, `burn`, and any supported fee-change signal. Map Slipstream and Uniswap V3 logs into that stream, then test the reducer with deterministic fixtures before touching live RPC. `Swap` updates post-swap sqrt price, current tick, and active liquidity. `Mint`/`Burn` update lower/upper tick liquidity and active liquidity when the current tick lies inside the changed range.

**Axis:** Event ingestion and reducer semantics

**Basis:** `direct:` the registry explicitly limits replay to one Slipstream pool and one Uniswap V3 pool. `external:` the V3 event interface emits tickLower/tickUpper/amount on Mint and Burn, and sqrtPrice/liquidity/tick on Swap. `reasoned:` a venue-normalized reducer contract avoids duplicating two near-identical maintenance loops while still preserving venue-specific fee/source validation.

**Rationale:** The hard part is not scanning logs; it is applying them exactly and proving the state transition model. A normalized contract makes the reducer reviewable and testable in isolation.

**Downsides:** Slipstream-specific fee behavior may need a small side lane. The normalized event type must not erase venue differences that affect quote parity.

**Confidence:** 84%

**Complexity:** Medium-High

**Status:** Unexplored

### 6. Quote API Maintenance Mode For Safe Fallback

**Description:** Extend compact CL quote unavailable metadata with maintenance-state reasons such as `delta-warming`, `drift-check-failed`, `repairing`, `event-gap`, or `snapshot-cadence-paused`. `www` should keep accepting only quoted rows whose maintenance state is fresh and drift-clean, while debug output reports the producer maintenance state when it falls back live.

**Axis:** Quote/API consumption and safety

**Basis:** `direct:` `www` already records `debug.quoteApi` attempts/used/fallback counts and falls back live for unavailable rows; `society-bots` already returns quote-specific unavailable rows with pool/freshness metadata. `reasoned:` delta maintenance introduces failure modes that are neither ordinary staleness nor malformed replay math, so they need explicit names.

**Rationale:** This keeps user-facing quote correctness boring while making operator diagnosis sharp. A reducer should earn compact quote usage; it should not silently feed the hot path while warming, lagging, or drift-failed.

**Downsides:** Requires a small wire-contract expansion in both repos. Too many reason codes can become noisy unless they are grouped carefully in diagnostics.

**Confidence:** 86%

**Complexity:** Low-Medium

**Status:** Unexplored

### 7. Cost-Aware Rollout Proof

**Description:** Make the delta rollout proof include provider-read economics, not only parity. The promotion evidence should show before/after `providerReadCount`, full snapshot count, log ranges scanned, changed log count, delta-applied pool count, drift-check result, compact quote used count, fallback count, and an estimated daily RPC-cost trajectory.

**Axis:** Observability and rollout economics

**Basis:** `direct:` replay metrics already include provider read count, duration, bitmap/tick counts, and state hash. `direct:` the user supplied a concrete daily RPC-cost regression after CL replay and compact quoting. `reasoned:` the feature is not healthy unless it proves both quote correctness and reduced provider pressure.

**Rationale:** This turns the central concern into an acceptance gate. It also prevents a future “technically indexed but still too expensive” outcome.

**Downsides:** Daily cost estimates may be provider-specific and approximate. The proof needs a short soak window before it is persuasive.

**Confidence:** 91%

**Complexity:** Low

**Status:** Unexplored

## Recommendation

The strongest next exploration is a **snapshot-seeded delta reducer with a full-snapshot cadence brake**. In practical sequence, first stop the minute-by-minute full replay capture from driving cost, then build the reducer for one replay pool in shadow mode, then compare its state hash against low-cadence full snapshots, then expose compact quotes only when the maintenance row says the delta state is fresh and drift-clean. After that works for `slipstream-usdc-weth-100`, add `uniswap-v3-usdc-weth-5bps`.

This should not become a giant indexer rewrite. The existing table, latest-pointer publication shape, compact quote API, `www` validation, live fallback, and parity tooling are the base. The change is the CL replay maintenance algorithm: full snapshots become checkpoints; bounded log scans become the normal wake.

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Keep full snapshots but use multicall | Could reduce latency but not the core provider-call/cost shape; weaker than delta maintenance. |
| 2 | Birth-to-head event backfill as first step | Too much initial risk; current full snapshots should seed the reducer. |
| 3 | Broad replay expansion to more CL pools | Scope overrun before the two-pool delta model is proven. |
| 4 | Move quote authority back to `www` raw state | Conflicts with the current compact quote boundary and recent branch work. |
| 5 | Remove full snapshots entirely | Throws away the strongest parity/audit tool; better as a low-cadence drift oracle. |
| 6 | WebSocket pending-log ingestion | More operational complexity than scheduled safe-block log scans need right now. |
| 7 | Dedicated external indexer service | Premature infrastructure for a two-pool reducer; the existing Lambda/table can prove the model first. |
| 8 | Store every historical state indefinitely | Useful later for analytics, but current problem is hot-path maintenance cost. |
| 9 | Delta-only compact quote promotion without shadow drift checks | Too risky; wrong replay state can produce plausible bad quotes. |
