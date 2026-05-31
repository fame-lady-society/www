---
date: 2026-05-23
topic: fame-pool-api-quoter-migration
---

# FAME Pool API Quoter Migration Requirements

## Summary

Move FAME swap quote execution to a quote-API-first model. `/api/fame/swap/quote` will derive compact `/fame/pool-quotes` from `FAME_POOL_API_URL`, request quotes for every supported candidate edge, and use live fallback per edge when the quote API is unavailable or returns an unusable row. Raw `/fame/pool-state` is not part of normal quote execution.

---

## Problem Frame

The current indexed helper path still reflects an earlier state-replay boundary: `www` can ask for raw pool state, replay some rows locally, and separately call a compact CL quote route. That split is now the wrong production shape. The raw state payload is bulky, pool-type-specific, and easy to accidentally keep in the hot path even after compact CL quotes exist.

The desired boundary is simpler: `society-bots` produces compact quote rows for supported quote chains, while `www` remains responsible for route construction, validation, user-facing quote assembly, and live fallback safety. This keeps indexed liquidity useful without making the frontend own replayable tick or reserve state.

---

## Actors

- A1. Swap user: Requests a FAME swap quote and needs a safe, timely route.
- A2. `www` quote endpoint: Builds candidate routes, asks the quote API for supported edge quotes, and assembles the final response.
- A3. FAME pool API: Returns compact quote rows or typed unavailable rows for supported quote chains.
- A4. Operator/debugger: Uses `includeDebug: true`, tests, and CloudWatch to verify quote API usage and fallback behavior.

---

## Key Flows

- F1. Quote API assisted quote
  - **Trigger:** A swap quote request reaches `/api/fame/swap/quote`.
  - **Actors:** A1, A2, A3
  - **Steps:** `www` builds candidate route edges, selects the edges whose pools are supported quote chains, requests compact quotes from `/fame/pool-quotes`, uses returned quote rows where valid, and uses live fallback for unsupported or unavailable edges.
  - **Outcome:** The user receives a normal quote response; route internals may use quote API rows, live rows, or both.
  - **Covered by:** R1, R2, R3, R4, R5

- F2. Debug-assisted diagnosis
  - **Trigger:** A quote request includes `includeDebug: true`.
  - **Actors:** A2, A3, A4
  - **Steps:** `www` returns structured quote API diagnostics covering attempted supported edges, quote API usage, miss reasons, timing, and fallback outcomes, while omitting raw pool-state payloads.
  - **Outcome:** An operator can tell whether `/fame/pool-quotes` was attempted and why any supported edge fell back live.
  - **Covered by:** R6, R7, R8

---

## Requirements

**Quote API boundary**
- R1. `www` must use `FAME_POOL_API_URL` as the server-only base for the FAME pool API and derive compact `/fame/pool-quotes` for normal quote execution.
- R2. `/api/fame/swap/quote` must not call raw `/fame/pool-state` during normal quote execution.
- R3. Raw pool-state access may remain in explicit debug, route-lab, or parity tooling, but it must not be required for user-facing quote flow.

**Supported quote chains**
- R4. `/api/fame/swap/quote` must send every supported candidate edge to `/fame/pool-quotes`; unsupported candidate edges continue to use existing live quote behavior.
- R5. The supported quote-chain set must include `slipstream-usdc-weth-100` and should include reserve-style pools once they are represented by compact quote rows.
- R6. `www` must accept valid compact quote rows only when they match the requested edge, source registry, token direction, amount, freshness cap, and local pool metadata.

**Fallback behavior**
- R7. When `/fame/pool-quotes` returns `unavailable`, returns an unusable row, fails validation, or times out for a supported edge, `www` must live-fallback that edge rather than suppressing the edge.
- R8. Quote API fallback reasons must remain visible to operators through debug data and/or CloudWatch, while normal user responses remain focused on the final quote.

**Timeouts and request budget**
- R9. Compact quote requests must use a quote-API-specific timeout, defaulting around 2500ms, configurable by server env, and capped by the remaining outer quote request budget.
- R10. Compact quote timeout behavior must not reuse raw pool-state timeout configuration.

**Debug and observability**
- R11. `includeDebug: true` may include structured quote API diagnostics for supported edges, including attempted, used, miss reason, status counts, timing, and selected quote evidence.
- R12. Debug diagnostics should be per supported edge when the payload stays reasonably small; if it becomes bulky, `www` may cap edge detail and include a summary.
- R13. Normal quote responses must not include server logs, raw tick payloads, raw reserve payloads, service tokens, or credentialed helper URLs.
- R14. Operational logs belong in CloudWatch. Response debug data is structured diagnostic evidence, not a transport for log lines.

**Tests**
- R15. The slice must include tests showing that normal quote execution uses `/fame/pool-quotes` for supported edges and does not call raw `/fame/pool-state`.
- R16. Tests must cover supported-edge live fallback for unavailable quote rows, helper timeout, validation mismatch, and freshness rejection.
- R17. Tests must cover debug output with per-supported-edge diagnostics or capped summary behavior.
- R18. Route-lab can be used once the quoter is deployed to dev

---

## Acceptance Examples

- AE1. **Covers R1, R2, R4, R15.** Given `FAME_POOL_API_URL` and service auth are configured, when `/api/fame/swap/quote` evaluates a route containing `slipstream-usdc-weth-100`, it requests that supported edge from `/fame/pool-quotes` and does not request `/fame/pool-state`.
- AE2. **Covers R4, R5, R7.** Given a route contains supported reserve-style and Slipstream edges, when the quote API returns a valid row for one edge and `unavailable` for another, `www` uses the valid quote row and live-fallbacks the unavailable edge.
- AE3. **Covers R6, R7, R16.** Given the quote API returns a row whose source registry, token direction, amount, freshness, or pool metadata does not match the request, `www` rejects that row for indexed use and live-fallbacks the edge.
- AE4. **Covers R9, R10, R16.** Given `/fame/pool-quotes` exceeds the compact quote timeout, `www` aborts the quote API attempt within the configured budget and live-fallbacks the affected supported edge.
- AE5. **Covers R11, R12, R13, R14, R17.** Given `includeDebug: true`, when supported edges are quoted or fall back, the response includes structured quote API diagnostics without raw pool-state payloads or server log lines.
- AE6. **Covers R18.** Given the implementation is ready for review, tests demonstrate the required quote API and fallback behavior with a live Doppler/RPC route-lab proof.

---

## Success Criteria

- User-facing quotes continue to return safely when the quote API is fresh, stale, unavailable, slow, or partially unsupported.
- Normal `www` quote execution no longer depends on raw `/fame/pool-state`.
- Operators can verify quote API attempts, accepted quote rows, and live fallback reasons with `includeDebug: true` and CloudWatch.
- Planning can proceed without inventing the fallback policy, timeout posture, or reserve-pool boundary.

---

## Scope Boundaries

- No raw tick, bitmap, initialized tick, or reserve-state payloads in normal quote responses.
- No server logs embedded in response bodies.
- No broad CL expansion beyond explicitly supported quote chains.
- No requirement to remove raw pool-state tooling used for route-lab, parity, or explicit debugging.
- No change to wallet execution semantics beyond preserving safe quote output and route context.

---

## Key Decisions

- Quote API is the hot path: `www` consumes compact quotes rather than replayable state in normal quote flow.
- Reserve pools should join the quote-chain model instead of remaining a raw pool-state exception.
- Supported-edge failures live-fallback per edge; they do not suppress the whole route by default.
- The compact quote timeout should be cold-start tolerant, with a default around 2500ms and an env override.
- Tests are the verification bar for this slice

---

## Dependencies / Assumptions

- The FAME pool API can expose compact quote rows for reserve-style pools in addition to `slipstream-usdc-weth-100`.
- `FAME_POOL_API_URL` and service auth are configured in environments where quote API usage is expected.
- CloudWatch is the operational log destination for quote API attempts, misses, and backend behavior.
- Existing live quote adapters remain available as the safety fallback.
