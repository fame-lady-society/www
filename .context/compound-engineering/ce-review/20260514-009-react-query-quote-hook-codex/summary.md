# Code Review: Todo 009 React Query Quote Hook

Date: 2026-05-14
Mode: headless, current checkout, scoped to todo 009 quote hook and widget recovery tests.

## Scope

- `src/features/fame-swap/hooks/useFameSwapQuote.ts`
- `src/features/fame-swap/hooks/useFameSwapQuote.test.ts`
- `src/features/fame-swap/state.test.ts`
- `docs/plans/2026-05-14-009-fame-swap-react-query-quote-hook-plan.md`

## Findings

No P1/P2 findings.

## Checks

- Correctness: remote quote fetching now runs through TanStack React Query with an input-complete query key and disabled local blocked states.
- Safety: query errors are mapped to display-safe `quote_adapter_failure` quotes, and query errors take precedence over cached data so stale executable quotes do not remain visible after a failed refresh.
- Testing: query key, enabled gates, abort signal propagation, request body identity, fresh `QueryClient` execution, non-OK sanitization, non-ready wire responses, wallet retry state, expired quote state, and protected simulation failure state are covered.
- Scope: route math, quote ranking, fee math, and transaction construction were not changed.

## Verification

- `bun test src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/features/fame-swap/state.test.ts src/features/fame-swap/components/FameSwapWidget.test.ts src/features/fame-swap/solver/quoteWire.test.ts src/features/fame-swap/ui/quoteView.test.ts src/features/fame-swap/solver/quote.test.ts`
- `yarn lint --file src/features/fame-swap/hooks/useFameSwapQuote.ts --file src/features/fame-swap/hooks/useFameSwapQuote.test.ts --file src/features/fame-swap/state.test.ts`
- `./node_modules/.bin/prettier --check src/features/fame-swap/hooks/useFameSwapQuote.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/features/fame-swap/state.test.ts docs/plans/2026-05-14-009-fame-swap-react-query-quote-hook-plan.md`
- `git diff --check -- src/features/fame-swap/hooks/useFameSwapQuote.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/features/fame-swap/state.test.ts docs/plans/2026-05-14-009-fame-swap-react-query-quote-hook-plan.md`

Review complete.
