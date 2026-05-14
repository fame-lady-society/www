---
title: "feat: Add shared FAME swap quote wire contract"
type: feat
status: complete
date: 2026-05-14
source_todo: .context/compound-engineering/todos/008-ready-p2-add-shared-quote-wire-contract-and-ready-path-tests.md
---

# feat: Add Shared FAME Swap Quote Wire Contract

## Overview

Move the public FAME quote response serializer and hook deserializer into one client-safe wire module. The API route should serialize every `FameSwapQuote` variant through that module, and `useFameSwapQuote` should parse ready and non-ready responses through the same contract. Add an injectable route-handler seam so ready-path API tests can use deterministic quotes without live Base RPC.

## Requirements Trace

- Todo `008`: API and hook share one quote DTO serializer/deserializer module.
- Todo `008`: ready API tests assert approval, swap, route, route hash fields, `expiresAt`, slippage/deadline, and bigint string serialization.
- Todo `008`: non-ready API tests assert full status-specific quote fields and no approval/swap/route calldata-like objects.
- Todo `008`: deserializer rejects ready responses whose decoded route hash does not match `materializedRouteHash`.
- Todo `008`: adding a new `FameSwapQuote.status` fails type-level handling until the wire contract is updated.

## Scope Boundaries

- Do not change route selection, live adapter behavior, or wallet execution behavior.
- Do not make live RPC a unit-test dependency.
- Keep route-lab-only protocol evidence out of public ready responses.
- Keep public non-ready responses structurally non-executable.
- Do not remove the existing `routeHash` compatibility alias for ready responses in this task; add canonical fields alongside it.

## Implementation Units

- [x] **Unit 1: Add Shared Quote Wire Module**

**Files:**

- Add: `src/features/fame-swap/solver/quoteWire.ts`
- Modify: `src/features/fame-swap/hooks/useFameSwapQuote.ts`
- Test: `src/features/fame-swap/solver/quoteWire.test.ts`

**Approach:**

- Move the deserializer, parser helpers, malformed-response fallback, and display-safe fetch-error conversion out of the hook into `quoteWire.ts`.
- Add `serializeFameSwapQuoteResponse(quote)` that returns a JSON-safe public API response for all quote statuses.
- For ready quotes, include canonical `fixtureRouteHash` and `materializedRouteHash`, keep `routeHash` as a compatibility alias, include transaction `approval` and `swap` requests, and use a public fee-breakdown serializer that strips `protocolEvidence`.
- For non-ready quotes, serialize the full status-specific quote variant and do not add approval, swap, route, or transaction request objects.
- Add both an exhaustive serializer switch with `assertNever` and a `satisfies Record<FameSwapQuoteStatus, true>` handled-status map so TypeScript catches new quote statuses that are not added to the wire contract.
- Keep the module free of `next/server`, environment reads, RPC clients, and server-only dependencies.

- [x] **Unit 2: Use Shared Serializer In The API Route**

**Files:**

- Modify: `src/app/api/fame/swap/quote/route.ts`
- Test: `src/app/api/fame/swap/quote/route.test.ts`

**Approach:**

- Replace the route's manual ready response object with `serializeFameSwapQuoteResponse`.
- Move `publicFeeBreakdown` out of the route and into the shared wire module.
- Keep validation, rate limiting, readiness lookup, and live quote execution in the route.
- Add `handleFameSwapQuotePost(request, deps)` as a test seam. Production `POST` calls it without deps. Tests can inject readiness and quote execution without live RPC.
- Apply the dependency seam only after body parsing, amount validation, token support checks, router override checks, config normalization, slippage normalization, and deadline conversion so ready-path tests still cover request-contract behavior.

- [x] **Unit 3: Add Ready And Non-Ready Wire Tests**

**Files:**

- Modify: `src/app/api/fame/swap/quote/route.test.ts`
- Add/modify: `src/features/fame-swap/solver/quoteWire.test.ts`
- Modify: `src/features/fame-swap/hooks/useFameSwapQuote.test.ts`

**Approach:**

- Add a deterministic ready API test using the injected handler seam and deterministic quote adapter.
- Assert ready response fields: token base fields, approval transaction, swap transaction, route, canonical hashes, `routeHash` alias, `expiresAt`, slippage, deadline-derived route deadline, fee breakdown, and stringified bigint fields.
- Add non-ready tests for status-specific fields and absence of approval/swap/route transaction data.
- Add a deserializer test that mutates `materializedRouteHash` and expects `quote_adapter_failure`.
- Add a handled-status-map test so the runtime suite documents the current public status list, while the `satisfies` map provides type-level drift detection.
- Keep hook tests focused on the hook using the shared deserializer, not duplicating parser internals.

- [x] **Unit 4: Review, Verify, And Close Todo**

**Files:**

- Modify: `.context/compound-engineering/todos/008-ready-p2-add-shared-quote-wire-contract-and-ready-path-tests.md`
- Optional: `docs/plans/2026-05-14-003-fame-swap-quote-wire-contract-plan.md`

**Approach:**

- Run focused quote wire, API, hook, and existing FAME quote tests.
- Run Prettier on touched files.
- Run the required review pass and fix any P1/P2 findings.
- Mark todo `008` complete only after verification passes.

## Verification Plan

- `./node_modules/.bin/prettier --check src/features/fame-swap/solver/quoteWire.ts src/features/fame-swap/solver/quoteWire.test.ts src/features/fame-swap/hooks/useFameSwapQuote.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/app/api/fame/swap/quote/route.ts src/app/api/fame/swap/quote/route.test.ts`
- `bun test src/features/fame-swap/solver/quoteWire.test.ts src/app/api/fame/swap/quote/route.test.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts`
- `bun test src/features/fame-swap/solver/quotes/rankRoutes.test.ts src/features/fame-swap/solver/amountSolver.test.ts src/features/fame-swap/transactions.test.ts`

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Ready API response shape changes unexpectedly for consumers | Medium | High | Keep existing `routeHash` alias and approval/swap transaction fields while adding canonical fields and tests. |
| Shared wire module imports server-only code | Low | High | Keep it under feature code with only client-safe imports from solver, router, transactions, viem helpers, and token types. |
| Deserializer becomes too strict for existing responses | Medium | Medium | Preserve compatibility fallbacks where safe, but fail closed for malformed ready route hashes. |
| Test seam bypasses production behavior | Medium | Medium | Limit injection to readiness and quote execution after request parsing/config normalization; keep production handler path unchanged. |

## Completion Notes

- Added `src/features/fame-swap/solver/quoteWire.ts` as the shared serializer/deserializer boundary.
- API ready responses now use the shared serializer, include canonical route hashes plus the `routeHash` compatibility alias, include approval/swap transaction requests, and strip route-lab-only protocol evidence.
- API non-ready responses now use the shared serializer and remain structurally non-executable.
- `useFameSwapQuote` now imports the shared deserializer and malformed-response fallback instead of maintaining a separate wire parser.
- Added deterministic ready-path API tests through `handleFameSwapQuotePost` dependency injection after request parsing/config normalization.
- Added quote-wire tests for handled statuses, canonical hash round trips, hash mismatch rejection, missing-route rejection, and non-ready status-specific fields.
- Verification passed with focused tests, Prettier, lint, and diff whitespace checks.
