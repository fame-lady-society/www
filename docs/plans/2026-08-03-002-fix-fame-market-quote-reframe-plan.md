---
title: FAME Market Quote Reframe - Update Plan
type: fix
date: 2026-08-03
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: user-directed
execution: code
---

# FAME Market Quote Reframe

## Goal

Make `/fame` show three clear prices with no internal quote language:

- **DeFi buy:** USDC and ETH needed to buy exactly `1,000,000 FAME`.
- **DeFi sell:** USDC and ETH received for selling exactly `1,000,000 FAME`.
- **NFT buy:** `1,050,000 FAME`, plus its USDC and ETH cost.

NFT sell is the DeFi sell price and must not be repeated.

This plan supersedes the `/fame` page replacement in plan 001. Keep the full
`main` page. Remove only its embedded next-to-mint and unrevealed NFT gallery.

## Product Contract

- R1. Restore the normal FLS app bar, menu, and Connect button on `/fame`, `/fame/market`, `/fame/gallery`, and `/fame/rotate`. Remove the landing-only menu.
- R2. DeFi buy uses an exact-target quote for `1,000,000 FAME` in USDC and native ETH.
- R3. DeFi sell uses an exact-input quote for `1,000,000 FAME` into USDC and native ETH.
- R4. NFT buy uses the marketplace charge, `FAME.unit() + premium()`, expected on the fork to be `1,050,000 FAME`. Its USDC and ETH values use exact-target quotes for that FAME amount.
- R5. Every displayed price uses `0%` slippage.
- R6. Load prices on the server first. If a price is missing, show an activity indicator and retry it from the browser.
- R7. Price cards use only short DeFi/NFT language. Do not show cache state, timestamps, routes, formulas, validation language, raw errors, scientific notation, or zero in place of missing data.
- R8. This is a disposable fork experience. No production deployment checks or evidence fixtures are required.
- R9. Keep the social links, contract addresses, copy buttons, DeFi links, story, checker, and FAQ from `main`.
- R10. Show market cap, Society liquidity, buy depth, and sell depth. Missing stats use the same activity indicator and browser retry as prices.

## Key Decisions

- KTD1. There are three unique price rows: DeFi buy, DeFi sell, and NFT buy.
- KTD2. NFT sell is not a fourth row; it is the same `1,000,000 FAME` DeFi sell.
- KTD3. Buy quotes are exact-target. Sell quotes are exact-input. No reverse exact-target investigation is needed.
- KTD4. The server tries first; the browser keeps trying while a price is missing.
- KTD5. Buy depth is USDC input within 2%. Sell depth is USDC output within 2%.

## Implementation Units

### U1. Restore the shared FLS shell

**Requirements:** R1.

**Files:** FAME route pages, shared FAME shell component, route/component tests.

**Done:** All four FAME routes show the normal app bar, menu, and Connect button with no duplicate landing menu.

### U2. Build the three price quotes

**Requirements:** R2-R5.

**Files:** `src/features/fame-landing/cachedMarketStats.ts`, `src/features/fame-swap/server/quoteService.ts`, focused tests.

**Done:**

- DeFi buy targets exactly `1,000,000 FAME`.
- DeFi sell inputs exactly `1,000,000 FAME`.
- NFT buy targets the live `unit + premium` FAME charge.
- USDC and ETH are quoted independently at `0%` slippage.

### U3. Add simple loading and retry

**Requirements:** R6-R8.

**Files:** landing price endpoint, landing board/client retry component, focused tests.

**Done:** The server supplies any prices it can. Missing prices show an activity indicator and retry in the browser without exposing internal errors.

### U4. Restore the page and DeFi stats

**Requirements:** R9-R10.

**Done:** The `main` page remains intact, the embedded NFT gallery is gone, and the price board includes market cap, liquidity, and both depth sides.

## Verification

- Focused tests cover the three price definitions, `0%` slippage, formatting, loading, and retry.
- Lint passes for touched files.
- `/fame` is checked at desktop and mobile widths.
- The page shows no duplicate NFT sell price, cache words, raw errors, scientific notation, or false zero.

## Definition of Done

- Visitors can compare DeFi buy, DeFi sell, and NFT buy in USDC and ETH.
- NFT buy also shows `1,050,000 FAME` from the fork marketplace charge.
- Missing values keep loading and retrying.
- The normal FLS shell is restored across the FAME routes.
- The full `main` page remains, minus the embedded NFT gallery.
