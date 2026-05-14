---
status: complete
priority: p2
issue_id: "008"
tags: [fame-swap, api, tests, serialization]
dependencies: []
---

# Add Shared Quote Wire Contract And Ready-Path Tests

## Problem Statement

The quote API and `useFameSwapQuote` still maintain separate hand-written serialization/deserialization logic. The P1 fixes restored non-ready union shape and canonical ready hash fields, but there is no shared DTO module or deterministic ready-path API test proving the executable wire contract.

## Findings

- `/api/fame/swap/quote` now returns full non-ready quote variants and separate `fixtureRouteHash` and `materializedRouteHash`.
- `useFameSwapQuote` now validates the materialized route hash against the decoded route.
- Review found missing ready-path API contract coverage and separate server/client wire-shape implementations.
- Current tests cover malformed input and some deserializer behavior, but not a fake ready API response built through the handler.

## Proposed Solutions

### Option 1: Shared DTO Module

**Approach:** Move bigint/date conversion and exhaustive quote status serialization into a feature module used by the API route and hook.

**Pros:**

- Prevents future drift between server and client quote shapes.
- Makes every new status fail tests until handled.

**Cons:**

- Requires careful migration of existing permissive hook parsing.

**Effort:** 4-8 hours

**Risk:** Medium

### Option 2: Handler Dependency Injection For Tests

**Approach:** Extract the POST implementation behind injectable readiness and adapter factories, then add fake ready-path tests without live RPC.

**Pros:**

- Directly covers executable approval/swap JSON shape.
- Keeps external RPC out of unit tests.

**Cons:**

- Adds one small test seam to the route handler.

**Effort:** 2-4 hours

**Risk:** Low

## Recommended Action

Do both options together. Add a shared quote wire module, then use an injected fake quote/readiness path to assert ready and non-ready API round trips, canonical hash fields, no transaction data on blocked statuses, and display-safe error fields.

## Acceptance Criteria

- [x] API and hook share one quote DTO serializer/deserializer module.
- [x] Ready API tests assert approval, swap, route, route hash fields, `expiresAt`, slippage/deadline, and bigint string serialization.
- [x] Non-ready API tests assert full status-specific quote fields and no approval/swap/route calldata-like objects.
- [x] Deserializer rejects ready responses whose decoded route hash does not match `materializedRouteHash`.
- [x] Adding a new `FameSwapQuote.status` fails type-level handling until API and hook wire handling are updated.

## Work Log

### 2026-05-14 - Triage

**By:** Codex

**Actions:**

- Created from API-contract, testing, and maintainability review findings.
- Kept as P2 because the immediate leakage/hash-shape issues have been fixed, but the contract still needs durable test coverage.

**Learnings:**

- Manual server/client quote shape drift is still the highest-risk remaining API maintenance issue.

### 2026-05-14 - Completion

**By:** Codex

**Actions:**

- Added shared quote wire module `src/features/fame-swap/solver/quoteWire.ts` for public API serialization, hook deserialization, handled-status tracking, display-safe fetch errors, malformed ready-response fallback, and protocol-evidence stripping.
- Updated `/api/fame/swap/quote` to serialize all ready and non-ready quote responses through the shared wire module.
- Added `handleFameSwapQuotePost(request, deps)` so tests can inject readiness and quote execution after parsing, validation, config normalization, slippage normalization, and deadline conversion.
- Updated `useFameSwapQuote` to consume the shared deserializer and fallback helper instead of maintaining a separate hand-written DTO parser.
- Added deterministic ready-path API tests for approval/swap transaction requests, route, canonical hashes, `routeHash` alias, `expiresAt`, deadline conversion, slippage, and bigint string serialization.
- Added non-ready API tests for full status-specific fields without approval/swap/route transaction objects.
- Added quote-wire tests for handled statuses, ready round trip, mismatched `materializedRouteHash`, omitted route failure, and non-ready status fields.
- Ran the required review pass and fixed malformed ready-route parsing to fail closed inside the shared deserializer.

**Verification:**

- Passed: `bun test src/features/fame-swap/solver/quoteWire.test.ts src/app/api/fame/swap/quote/route.test.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/features/fame-swap/solver/quotes/rankRoutes.test.ts src/features/fame-swap/solver/amountSolver.test.ts src/features/fame-swap/transactions.test.ts`
- Passed: `./node_modules/.bin/prettier --check src/features/fame-swap/solver/quoteWire.ts src/features/fame-swap/solver/quoteWire.test.ts src/features/fame-swap/hooks/useFameSwapQuote.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/app/api/fame/swap/quote/route.ts src/app/api/fame/swap/quote/route.test.ts`
- Passed: `yarn lint --file src/features/fame-swap/solver/quoteWire.ts --file src/features/fame-swap/solver/quoteWire.test.ts --file src/features/fame-swap/hooks/useFameSwapQuote.ts --file src/features/fame-swap/hooks/useFameSwapQuote.test.ts --file src/app/api/fame/swap/quote/route.ts --file src/app/api/fame/swap/quote/route.test.ts`
- Passed: `git diff --check -- src/features/fame-swap/solver/quoteWire.ts src/features/fame-swap/solver/quoteWire.test.ts src/features/fame-swap/hooks/useFameSwapQuote.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/app/api/fame/swap/quote/route.ts src/app/api/fame/swap/quote/route.test.ts docs/plans/2026-05-14-003-fame-swap-quote-wire-contract-plan.md`
