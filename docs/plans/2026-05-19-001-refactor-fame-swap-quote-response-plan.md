---
title: "refactor: Compact FAME swap quote responses"
type: refactor
status: completed
date: 2026-05-19
---

# refactor: Compact FAME Swap Quote Responses

## Summary

Compact the default `/api/fame/swap/quote` response so the frontend receives only the status, UI display fields, and executable route data it needs. Keep bulky quote diagnostics available through an explicit `includeDebug` request flag, preserving the current safety boundary around protocol evidence, helper secrets, RPC URLs, and calldata-like data.

---

## Problem Frame

The FAME swap quote API can return roughly 63 KB for ordinary quote requests because debug-oriented fields ride along with the normal frontend payload. The existing wire contract already strips some route-lab-only protocol evidence, but top-level transaction request objects, optimizer summaries, rejection arrays, and warning/debug details still inflate the public response even when the widget does not need them.

---

## Requirements

- R1. Default quote responses must include only the data needed for status display, route UI, quote freshness, and client-side contract request construction.
- R2. Debug-oriented fields must be omitted by default and exposed only when the request body includes `includeDebug: true`.
- R3. Ready responses must remain executable by the existing frontend, including protected simulation and final router calls.
- R4. Non-ready responses must remain structurally non-executable by default.
- R5. The serializer and deserializer must continue to fail closed for malformed ready routes and handle every `FameSwapQuote.status` exhaustively.
- R6. The change must not alter route selection, liquidity quoting, transaction encoding, router ABI behavior, or solver behavior.

---

## Scope Boundaries

- Do not implement the quote API response refactor in this planning task.
- Do not remove the executable `route` from default ready responses; the client uses it for protected simulation and final swap calls.
- Do not add query-string debug toggles; the opt-in is the POST body flag `includeDebug`.
- Do not add new public exposure for `protocolEvidence`, `activeLiquidity`, helper service tokens, RPC URLs, raw calldata, or signer/private material.
- Do not change the solver, live adapters, indexed pool-state helper semantics, route graph, or wallet execution flow except where tests need to assert the compact wire contract.

### Deferred to Follow-Up Work

- Route diagnostics UI redesign: if the default compact payload leaves the collapsed diagnostics panel less detailed, improve that panel separately after the wire payload is slimmed.
- Additional payload compression or transport-level caching: this plan focuses on response shape, not HTTP compression, edge caching, or solver caching.

---

## Context & Research

### Relevant Code and Patterns

- `src/app/api/fame/swap/quote/handler.ts` parses request bodies, validates quote inputs, runs readiness/quote execution, and currently calls `serializeFameSwapQuoteResponse(quote)` without options.
- `src/features/fame-swap/solver/quoteWire.ts` owns the shared JSON-safe serializer/deserializer and currently includes top-level `approval`, `swap`, `rejectedCandidates`, `optimizerSummary`, and `warnings` in normal ready responses.
- `src/features/fame-swap/hooks/useFameSwapQuote.ts` sends the normal frontend POST body and deserializes the API response into the internal `FameSwapQuote` shape.
- `src/features/fame-swap/transactions.ts` already reconstructs approval and swap contract requests from a ready quote's route, so top-level serialized `approval` and `swap` are redundant for the frontend.
- `src/features/fame-swap/components/RouteDiagnostics.tsx` reads `optimizerSummary` and `rejectedCandidates` when present, so compact default deserialization should tolerate their absence.

### Institutional Learnings

- `docs/plans/2026-05-14-003-fame-swap-quote-wire-contract-plan.md` established the shared quote wire boundary, canonical hash fields, and fail-closed deserialization for ready responses.
- `docs/solutions/architecture-patterns/fame-swap-indexed-pool-state-quote-helper-2026-05-19.md` reinforces that public quote responses must preserve indexed context while avoiding helper credentials and protocol evidence leaks.
- `docs/solutions/performance-issues/fame-swap-quote-solver-timeouts-native-wrap-routing-2026-05-15.md` notes that public quote diagnostics should be stripped of internal route-lab/protocol evidence while keeping executable quote correctness intact.

### External References

- Not used. The repo has a direct local wire-contract pattern and the task is a project-specific API-shape refactor.

---

## Key Technical Decisions

- Keep `route` in the compact ready response: protected simulation, route hash validation, and final contract request construction depend on the decoded route.
- Remove top-level `approval` and `swap` from default ready responses: they duplicate client-reconstructed data and include ABI-heavy contract request objects.
- Move debug opt-in data under a single `debug` object: this makes the normal payload easy to audit and prevents debug fields from creeping back into the public response.
- Parse debug-backed fields in the deserializer as optional enrichment: the frontend should continue to build a usable quote when `debug` is absent.
- Keep all existing sanitization and public fee-breakdown stripping: `includeDebug` is for operational quote diagnostics, not raw route-lab/private evidence.

---

## Open Questions

### Resolved During Planning

- Should the debug flag be a query string or body field? Use the POST body field `includeDebug`, matching the existing request parser boundary.
- Can the API omit `approval` and `swap` safely? Yes; `fameSwapTransactionRequests` reconstructs these from the ready quote locally.
- Can the default response omit `rejectedCandidates` and `optimizerSummary`? Yes; these are diagnostics, and consumers already need to tolerate absent summaries.

### Deferred to Implementation

- Exact compact-response size target: implementation should measure representative ready quotes and assert a meaningful reduction without making the test brittle to unrelated route-size changes.
- Exact debug object shape: keep it small and typed, but allow the implementing agent to choose names that best fit the existing quote-wire helpers.

---

## Implementation Units

### U1. Prepare Baseline and Parse Debug Opt-In

**Goal:** Start implementation from the merged `origin/main` state and teach the quote API request parser about the optional debug flag.

**Requirements:** R2, R6

**Dependencies:** None

**Files:**
- Modify: `src/app/api/fame/swap/quote/handler.ts`
- Test: `src/app/api/fame/swap/quote/route.test.ts`

**Approach:**
- Before implementation, sync the workspace to `origin/main` and discard tracked feature-branch changes while leaving untracked local files alone unless they block the work.
- Extend the parsed quote body with `includeDebug?: boolean`.
- Accept only an actual boolean value for the flag; omitted or non-boolean values should behave like `false` rather than creating a new validation failure for normal quote requests.
- Pass the parsed flag into `serializeFameSwapQuoteResponse`.
- Keep all existing request validation, slippage/deadline normalization, readiness lookup, rate limiting, and dependency-injection seams unchanged.

**Patterns to follow:**
- `parseQuoteBody` in `src/app/api/fame/swap/quote/handler.ts` for simple explicit body parsing.
- Existing deterministic API tests in `src/app/api/fame/swap/quote/route.test.ts`.

**Test scenarios:**
- Happy path: a normal POST body without `includeDebug` serializes through the compact default path.
- Happy path: a POST body with `includeDebug: true` serializes with a `debug` object.
- Edge case: `includeDebug: false` behaves exactly like omission.
- Edge case: non-boolean `includeDebug` does not break otherwise valid quote requests and is treated as false.
- Integration: injected `quoteForRequest` still receives normalized quote request data, and only the serializer option changes.

**Verification:**
- API route tests prove the flag controls response shape without changing quote execution inputs.

---

### U2. Compact the Shared Quote Wire Serializer

**Goal:** Make default serialized quote responses small and frontend-oriented while keeping debug fields available under explicit opt-in.

**Requirements:** R1, R2, R4, R5

**Dependencies:** U1

**Files:**
- Modify: `src/features/fame-swap/solver/quoteWire.ts`
- Test: `src/features/fame-swap/solver/quoteWire.test.ts`

**Approach:**
- Add serializer options for `includeDebug`.
- For ready quotes, keep the compact public fields needed by the UI and transaction path: status, token/request amounts, message/status flags, route artifact/source, router address, output/minimum/fee/slippage/expiry fields, canonical hashes and `routeHash`, executable `route`, `callValue`, public fee breakdown, quote context, fee ppm, capabilities, pool ids, and route display.
- Remove default top-level `approval`, `swap`, `rejectedCandidates`, `optimizerSummary`, and raw warnings/debug detail.
- When debug is enabled, include a `debug` object with omitted diagnostics such as reconstructed transaction requests, rejected candidates, optimizer summary, and warnings.
- For non-ready quotes, keep only status, token/request amounts, message, diagnostic visibility, and status-specific user-facing fields by default; put rejected candidates and other operational detail under `debug`.
- Keep `publicFeeBreakdown` stripping protocol evidence for both default and debug paths.
- Preserve exhaustive status handling with `assertNever` and the handled-status map.

**Patterns to follow:**
- Existing `serializeFameSwapQuoteResponse`, `publicFeeBreakdown`, and `toJsonSafe` helpers in `src/features/fame-swap/solver/quoteWire.ts`.
- Existing tests that assert no `protocolEvidence` or `activeLiquidity` leaks.

**Test scenarios:**
- Happy path: default ready serialization includes the route/hash/output/UI fields and omits `approval`, `swap`, `rejectedCandidates`, `optimizerSummary`, `warnings`, and `debug`.
- Happy path: debug ready serialization includes a `debug` object containing the omitted diagnostics.
- Happy path: default non-ready serialization includes status-specific user-facing fields and no executable transaction data.
- Happy path: debug non-ready serialization places rejected candidates under `debug`.
- Edge case: a quote containing optimizer evidence still does not serialize raw optimizer evidence, allocation trials, protocol evidence, or active liquidity.
- Integration: representative ready payload size is materially smaller than the debug payload and below the prior bulky response class.

**Verification:**
- Quote-wire tests document both compact default and debug opt-in contracts.

---

### U3. Accept Compact Responses in the Client Deserializer

**Goal:** Ensure the frontend can deserialize compact API responses into the existing internal `FameSwapQuote` shape and rebuild contract requests locally.

**Requirements:** R1, R3, R4, R5

**Dependencies:** U2

**Files:**
- Modify: `src/features/fame-swap/solver/quoteWire.ts`
- Modify: `src/features/fame-swap/hooks/useFameSwapQuote.ts`
- Test: `src/features/fame-swap/hooks/useFameSwapQuote.test.ts`
- Test: `src/features/fame-swap/transactions.test.ts`

**Approach:**
- Keep `fetchFameSwapRemoteQuote` unchanged for normal frontend calls; it should not send `includeDebug`.
- Update deserialization to read `rejectedCandidates`, `optimizerSummary`, and warnings from `debug` when present and default them to empty or absent when not present.
- Continue reconstructing `approval` from the input token and decoded route, and `callValue` from either serialized `callValue` or native route amount.
- Preserve ready-response route hash validation against `materializedRouteHash`.
- Ensure non-ready compact responses still become non-executable internal quote variants with empty rejected-candidate arrays where the type requires them.

**Patterns to follow:**
- Existing `deserializeFameSwapQuoteResponse` fail-closed behavior in `src/features/fame-swap/solver/quoteWire.ts`.
- Existing `fameSwapTransactionRequests` reconstruction in `src/features/fame-swap/transactions.ts`.

**Test scenarios:**
- Happy path: compact ready API response deserializes into a ready quote with route amount, approval amount, route hash, fee data, and route display intact.
- Happy path: `fameSwapTransactionRequests` rebuilds approval and swap contract requests from a compact-deserialized quote.
- Happy path: debug ready API response restores rejected candidates and optimizer summary into the internal quote.
- Edge case: compact ready response without debug yields empty rejected candidates and no optimizer summary.
- Error path: malformed route/hash mismatch still returns `quote_adapter_failure`.
- Error path: compact non-ready response does not gain `route`, `approval`, or `swap`.

**Verification:**
- Hook and transaction tests prove normal frontend fetches remain executable without requesting debug data.

---

### U4. Update API and UI Regression Coverage

**Goal:** Lock the behavior across the API route, hook, widget, and route-view layers so the compact response does not break normal swap UX.

**Requirements:** R1, R2, R3, R4, R6

**Dependencies:** U1, U2, U3

**Files:**
- Modify: `src/app/api/fame/swap/quote/route.test.ts`
- Modify: `src/features/fame-swap/hooks/useFameSwapQuote.test.ts`
- Modify: `src/features/fame-swap/solver/quoteWire.test.ts`
- Test: `src/features/fame-swap/components/FameSwapWidget.test.ts`
- Test: `src/features/fame-swap/ui/quoteView.test.ts`
- Test: `src/features/fame-swap/ui/routeGraph.test.ts`

**Approach:**
- Update ready-path API tests that currently expect top-level `approval` and `swap`; they should assert those fields are absent by default and available only under `debug`.
- Update non-ready API tests to assert rejected candidates move under `debug` when requested and are absent from the default public payload.
- Keep existing tests that assert no `executeRoute`, `approve`, or calldata-like fields exist for non-ready responses.
- Add or adjust UI-facing tests only where compact deserialization changes expectations around diagnostics summaries.
- Preserve tests around public fee breakdown stripping and indexed quote context.

**Patterns to follow:**
- Existing API ready/non-ready tests in `src/app/api/fame/swap/quote/route.test.ts`.
- Existing route-view and route-graph tests that assert display data is available from ready quotes.

**Test scenarios:**
- Integration: default API ready response is compact, still deserializes, and still builds local transaction requests.
- Integration: debug API ready response carries diagnostics without leaking protocol evidence or active liquidity.
- Integration: route map and quote panel still render from compact-deserialized ready quote fields.
- Integration: non-ready compact response keeps swap actions disabled and structurally non-executable.
- Error path: live quote adapter failure response hides rejected candidates by default but exposes sanitized candidates in debug mode.

**Verification:**
- Focused quote-wire/API/hook/transaction tests and affected widget/view tests pass.
- Static checks do not report new unsafe casts, `any`, or lint violations.

---

## System-Wide Impact

- **Interaction graph:** The API route, shared wire module, remote quote hook, transaction request builder, diagnostics panel, and route-map display all consume the ready quote shape.
- **Error propagation:** Quote execution failures should still return non-ready quote statuses; debug data changes where details are serialized, not the failure classification.
- **State lifecycle risks:** React Query cache keys and quote refresh behavior should not change because the normal request body remains unchanged.
- **API surface parity:** The public API response changes by removing default fields; tests must document compact default shape and debug opt-in shape.
- **Integration coverage:** Unit tests alone are not enough; at least one API-to-deserializer-to-transaction-request path must be covered.
- **Unchanged invariants:** Route hash validation, non-ready non-executability, public fee-breakdown redaction, indexed quote-context preservation, and exhaustive status handling remain intact.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Removing top-level `approval` and `swap` breaks an unnoticed frontend consumer | Prove the hook and transaction builder reconstruct requests from compact ready responses; search for direct top-level response consumers before editing. |
| Diagnostics UI becomes less informative on normal frontend quotes | Treat detailed diagnostics as debug-only for this change; leave UI redesign as follow-up work. |
| Debug mode accidentally reintroduces sensitive evidence | Keep debug construction explicit and reuse public redaction helpers; add negative assertions for protocol evidence, active liquidity, URLs, calldata-like data, and secrets. |
| Payload-size assertion becomes brittle | Assert relative reduction or broad threshold from a representative quote rather than exact byte counts. |
| Resetting to `origin/main` drops the plan file before implementation | Preserve or reapply this plan after the baseline reset if implementation begins from a freshly reset branch. |

---

## Documentation / Operational Notes

- The plan itself documents the API response change; no user-facing documentation is required unless external consumers besides the app are discovered during implementation.
- If implementation starts immediately after this plan is recorded, account for the existing dirty `.gitignore` and untracked `.codex` state before resetting to the merged mainline branch.

---

## Sources & References

- Related plan: `docs/plans/2026-05-14-003-fame-swap-quote-wire-contract-plan.md`
- Related learning: `docs/solutions/architecture-patterns/fame-swap-indexed-pool-state-quote-helper-2026-05-19.md`
- Related learning: `docs/solutions/performance-issues/fame-swap-quote-solver-timeouts-native-wrap-routing-2026-05-15.md`
- Related code: `src/app/api/fame/swap/quote/handler.ts`
- Related code: `src/features/fame-swap/solver/quoteWire.ts`
- Related code: `src/features/fame-swap/hooks/useFameSwapQuote.ts`
- Related code: `src/features/fame-swap/transactions.ts`
