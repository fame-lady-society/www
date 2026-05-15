---
date: 2026-05-15
status: active
topic: fame-swap-aerodrome-v2-then-adaptive-search
---

# Goal: Complete Todo 015, Then 013

Drive the next FAME swap solver work in strict order:

1. `.context/compound-engineering/todos/015-complete-p1-enable-aerodrome-v2-explicit-factory-router.md` $ce:plan -> $ce:work -> $ce:review
2. `.context/compound-engineering/todos/013-complete-p2-add-adaptive-route-search-algorithms.md` $ce:ideate -> $ce:brainstorm -> $ce:plan -> $ce:review

Do not start `013` until `015` is implemented, verified, logged, and marked complete. Adaptive search must optimize the final Aerodrome V2 venue model, not the old Solidly-shaped approximation.

Use `doppler run --` for builds, tests, route-lab commands, and RPC-backed probes. Do not leak RPC URLs, signer keys, or executable failure payloads.

## 015: Aerodrome V2 Explicit Factory

Implement app support for FameRouter `VenueFamily.AerodromeV2 = 7`. Use the router, factory, USDC/WETH pool, and pool-proof constants from todo `015`; do not duplicate or reinterpret them from memory.

Required work:

- $ce:plan -> $ce:work -> $ce:review
- Represent Aerodrome V2 pools with `pool`, `stable`, and explicit `factory`.
- Encode ordinal `7` with `from`, `to`, `stable`, `factory`, and `deadline`.
- Stop encoding Aerodrome V2 USDC/WETH as a Solidly three-field route while preserving Solidly behavior.
- Keep migrated Slipstream pools out of scope and make diagnostics distinguish Aerodrome V2 from Solidly.

Verify route compiler ordinal `7`, four-field Aerodrome ABI, Solidly three-field regression, Aerodrome V2 USDC/WETH quote path, and focused FAME swap suite under `doppler run --`. Update the `015` work log before marking complete.

## 013: Adaptive Route Search

After `015` is complete, implement adaptive allocation search on the baseline optimizer. Work the entire ce flow $ce:ideate -> $ce:brainstorm -> $ce:plan -> $ce:review

Re-check first:

- `012` baseline optimizer remains the correctness oracle.
- Route-lab shows grid traces for split or terminal-split routes.
- Request-scoped quote/state memoization is active.
- Aerodrome V2 routes are their own venue family.

Implementation order:

1. Adaptive 2-way split search with grid fallback.
2. 3+ allocation search behind a strict quote-call budget.
3. Marginal-price allocation only for vetted exact local-math pools with complete pinned-block state.

Gates:

- Use adaptive 2-way search only when samples are smooth enough and quotes succeed.
- Fall back to grid or fail closed for non-unimodal samples, quote failures, unknown stable curves, V4 hooks, unvetted factories, or unsupported protocols.
- 3+ search must emit stop reasons and avoid combinatorial growth.
- Final adaptive routes must still pass protected materialization and simulation.

Verify deterministic grid parity, route-lab algorithm and stop reasons, 3+ quote budgets, public trace stripping, and focused solver/route-lab tests under `doppler run --`. Update the `013` work log before marking complete.

## Rules

- Keep scope to FAME swap route encoding, solver optimization, route-lab diagnostics, and tests.
- Preserve `maxTemplates: 32` unless the user explicitly changes it.
- Do not replace the coarse-grid optimizer; use it as the oracle.
- Create follow-up todos for remaining Aerodrome V2, adaptive-search, or local-math gaps.
