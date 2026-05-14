---
mode: headless
scope: todo-008-quote-wire-contract
status: complete
---

# Code Review: Todo 008 Quote Wire Contract

## Review Scope

- `src/features/fame-swap/solver/quoteWire.ts`
- `src/features/fame-swap/solver/quoteWire.test.ts`
- `src/app/api/fame/swap/quote/route.ts`
- `src/app/api/fame/swap/quote/route.test.ts`
- `src/features/fame-swap/hooks/useFameSwapQuote.ts`
- `src/features/fame-swap/hooks/useFameSwapQuote.test.ts`

## P1/P2 Findings

None remaining after fixes.

## Fixes Applied During Review

- Wrapped ready-response route decoding and hash validation so malformed ready wire responses become shared `quote_adapter_failure` results instead of escaping through parser exceptions.
- Added a regression test for ready responses that omit the decoded route.

## Verification

- `bun test src/features/fame-swap/solver/quoteWire.test.ts src/app/api/fame/swap/quote/route.test.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/features/fame-swap/solver/quotes/rankRoutes.test.ts src/features/fame-swap/solver/amountSolver.test.ts src/features/fame-swap/transactions.test.ts` passed.
- `./node_modules/.bin/prettier --check src/features/fame-swap/solver/quoteWire.ts src/features/fame-swap/solver/quoteWire.test.ts src/features/fame-swap/hooks/useFameSwapQuote.ts src/features/fame-swap/hooks/useFameSwapQuote.test.ts src/app/api/fame/swap/quote/route.ts src/app/api/fame/swap/quote/route.test.ts` passed.
- `yarn lint --file ...` passed for the touched 008 files.
- `git diff --check -- ...` passed for the touched 008 files and plan.
