---
status: complete
priority: p2
issue_id: "009"
tags: [fame-swap, widget, react-query, tests]
dependencies: ["008"]
---

# Complete Widget Fetch And Recovery Tests With React Query

## Problem Statement

The widget quote hook is carrying custom fetch lifecycle code for debounce, cancellation, loading, error recovery, and refresh even though the app already uses TanStack React Query. That makes the behavior harder to test and easier to regress. A regression here could reintroduce frequent quote cancels, stale executable quotes, disabled retry after wallet rejection, or an unusable expired/simulation-failed CTA.

## Findings

- `src/context/Wagmi.tsx` already provides a TanStack `QueryClientProvider`.
- Other feature hooks already use `useQuery`, so the quote hook can follow an existing project convention.
- `useFameSwapQuote` currently manages `quote`, `isLoading`, `error`, debounced fetch timing, aborts, stale response guards, and refresh with local React state/effects.
- React Query already owns query keys, `enabled`, request cancellation via `queryFn` `signal`, stale response protection, loading/error state, cache invalidation, and refetch.
- `useFameSwapTransaction` now separates wallet/write errors from on-chain reverts so retryable submission failures do not become terminal reverts.
- User feedback specifically called out frequent quote cancels as felt in the live widget.

## Proposed Solutions

### Option 1: Refactor `useFameSwapQuote` Onto `useQuery`

**Approach:** Build a stable quote query key from token pair, amount, recipient, slippage, deadline, readiness, and refresh nonce. Use `enabled` for executable remote quote requests, pass React Query's `signal` into `fetch`, deserialize in the query function, and map query errors to display-safe `quote_adapter_failure` results at the hook boundary. Keep local blocked quotes synchronous and outside the remote query.

**Pros:**

- Removes custom request bookkeeping from the hook.
- Lets React Query handle stale responses, cancellation, loading/error state, and refetch.
- Makes tests focus on inputs and returned state instead of implementation timing details.

**Cons:**

- Still needs a minimal test `QueryClientProvider`.
- Debouncing, if still needed for UX, should be a small input-level delay rather than a custom fetch manager.

**Effort:** 4-8 hours

**Risk:** Low-Medium

### Option 2: Keep Custom Fetch State And Add Harness Tests

**Approach:** Add tests around the current effect-based fetch lifecycle with mocked `fetch`, fake timers, custom abort assertions, and manually controlled readiness/account inputs.

**Pros:**

- Lowest code movement.

**Cons:**

- Reinforces code React Query should own.
- Keeps the hardest behavior coupled to timers and effect cleanup.
- More brittle than testing query key, `enabled`, `signal`, and refetch behavior.

**Effort:** 4-8 hours

**Risk:** Medium

## Recommended Action

Refactor `useFameSwapQuote` to use TanStack `useQuery` before expanding tests. Do not build a custom query/cache/cancellation layer. Keep the hook's public return shape stable for the widget, but derive it from React Query state:

- `queryKey`: stable tuple/object for the quote request inputs plus refresh nonce.
- `enabled`: only true when amount, recipient, and readiness allow a remote quote.
- `queryFn`: `POST /api/fame/swap/quote`, using the provided `signal`, throwing on non-OK responses, and returning a deserialized `FameSwapQuote`.
- Local blocked quote: returned synchronously when readiness or recipient prevents a remote quote.
- Error quote: derive `quote_adapter_failure` from `query.error` for display safety.
- Refresh: call the query refetch path or bump the existing refresh nonce only if a unique execution key is required.

After the refactor, add focused hook tests with a fresh `QueryClient` per test and a minimal provider wrapper. Include one rendered-widget smoke test only if hook tests cannot prove the CTA recovery wiring.

## Acceptance Criteria

- [x] `useFameSwapQuote` uses TanStack `useQuery` for remote quote fetches instead of custom local fetch lifecycle state.
- [x] The query key includes every quote-affecting input: token pair, amount, recipient, slippage, deadline, readiness, and refresh/execution identity.
- [x] The query is disabled for empty amount, missing recipient, or non-ready local states; blocked quotes remain synchronous and do not call the API.
- [x] The query function passes React Query's `signal` to `fetch`, and stale/out-of-order responses cannot restore old executable approval/swap intent.
- [x] Non-OK responses become display-safe non-executable `quote_adapter_failure` quotes.
- [x] Rapid amount edits are covered at the query-key/enabled boundary; if debouncing remains, it is implemented as a small input debounce rather than a custom request manager.
- [x] Wallet rejection/write failure keeps the same valid quote retryable and does not render a terminal revert state.
- [x] Expired quote and protected simulation failure states block submission and expose a clear refresh/edit recovery path.
- [x] Slippage/deadline changes propagate into the quote request body and execution key.

## Work Log

### 2026-05-14 - Completed React Query Quote Hook

**By:** Codex

**Actions:**

- Refactored `useFameSwapQuote` so remote executable quote requests use TanStack `useQuery` rather than local fetch lifecycle state.
- Added stable query key, remote-enabled, remote input, and signal-aware fetch helpers for quote requests.
- Kept local blocked quote states synchronous for empty amount, missing recipient, and non-ready readiness.
- Mapped query failures to display-safe non-executable `quote_adapter_failure` quotes and made query errors take precedence over cached data.
- Added query-key, disabled-gate, abort-signal, request-body, fresh `QueryClient`, non-OK sanitization, non-ready wire, wallet retry, expired quote, and protected simulation failure tests.
- Recorded plan and review artifacts:
  - `docs/plans/2026-05-14-009-fame-swap-react-query-quote-hook-plan.md`
  - `.context/compound-engineering/ce-review/20260514-009-react-query-quote-hook-codex/summary.md`

**Verification:**

- `bun test src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/features/fame-swap/state.test.ts src/features/fame-swap/components/FameSwapWidget.test.ts src/features/fame-swap/solver/quoteWire.test.ts src/features/fame-swap/ui/quoteView.test.ts src/features/fame-swap/solver/quote.test.ts`
- `yarn lint --file src/features/fame-swap/hooks/useFameSwapQuote.ts --file src/features/fame-swap/hooks/useFameSwapQuote.test.ts --file src/features/fame-swap/state.test.ts`
- `./node_modules/.bin/prettier --check src/features/fame-swap/hooks/useFameSwapQuote.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/features/fame-swap/state.test.ts docs/plans/2026-05-14-009-fame-swap-react-query-quote-hook-plan.md`
- `git diff --check -- src/features/fame-swap/hooks/useFameSwapQuote.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/features/fame-swap/state.test.ts docs/plans/2026-05-14-009-fame-swap-react-query-quote-hook-plan.md`

**Learnings:**

- The hook does not need to duplicate React Query's stale-result and cancellation lifecycle. The remaining hook responsibility is choosing between local blocked quotes, remote query data, and non-executable query failure display.

### 2026-05-14 - Triage

**By:** Codex

**Actions:**

- Created from testing review and live UX feedback about frequent quote cancellations.
- Added dependency on todo `008` because stable quote DTOs make hook tests less brittle.
- Updated scope to refactor quote fetching onto TanStack React Query before adding more lifecycle tests.

**Learnings:**

- The app already has React Query infrastructure. The durable fix should remove custom request lifecycle code, then test the hook through query keys, `enabled`, `signal`, error mapping, and refresh behavior.
