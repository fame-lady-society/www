# FAME Swap Route Lab

## usdc-fame-fixture

- Mode: indexed
- Pair: USDC->FAME
- Amount in: 1000000
- Status: ready
- Expected: ready
- Selected pools: slipstream-usdc-frxusd, scale-equalizer-frxusd-fame
- Quote context: n/a
- Router fee amount: 9353388872525821460
- Venue fees included in quotes: true
- Computable price-impact legs: 2
- Max leg market impact bps: 105
- Rejections: 260
- Candidate generation diagnostics: 1
- Optimizer: selected, allocation n/a, trials 306, cache hits 125
- Indexed pool state: fresh 7, stale 0, unknown 1, unsupported 12, max freshness 120
- Edge matrix: selected 2, considered 16, rejected 2, disabled 2, missing 2
- Protocol coverage: selected 2, considered 16, rejected 2, disabled 2, missing 2
- Simulation: Indexed route lab does not run live route simulation.

### Candidate Generation Diagnostics

- split_candidate_budget_exceeded: Split candidate generation stopped after 40 split candidates.

### Optimizer

- Status: selected
- Selected template: single-solver-single_path-slipstream-usdc-frxusd--scale-equalizer-frxusd-fame
- Selected allocation bps: n/a
- Selected allocation vector: n/a
- Selected algorithm: n/a
- Selected stop reason: n/a
- Selected candidate: solver-single_path-slipstream-usdc-frxusd--scale-equalizer-frxusd-fame
- Fallback reason: n/a
- Trial statuses: selected 0, rejected 54, pruned 8, budget_exhausted 179, quote_failed 73, unsupported_shape 0, ineligible 4
- Quote plan stats: logical 320, unique exact 144, exact cache hits 125, unique state 0, state cache hits 0, rpc 0

| Allocation | Algorithm | Stop | Status | Pools | Protected | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| n/a | local_math | unsupported_protocol | ineligible | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | n/a | Local marginal-price allocation requires an explicit adapter capability with complete pinned-block state. |
| 0 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, uniswap-v2-fame-direct | 4144946118648566872698 | Quoted successfully but did not win the optimizer objective. |
| 500 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4143273031741964950192 | Quoted successfully but did not win the optimizer objective. |
| 1000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4141597883371977745889 | Quoted successfully but did not win the optimizer objective. |
| 2000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4138241402254564435259 | Quoted successfully but did not win the optimizer objective. |
| 3500 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4133191219682532054319 | Quoted successfully but did not win the optimizer objective. |
| 5000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4128122484111691456497 | Quoted successfully but did not win the optimizer objective. |
| 6500 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4123035195627853602938 | Quoted successfully but did not win the optimizer objective. |
| 8000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4117929354316816333353 | Quoted successfully but did not win the optimizer objective. |
| 9000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4114515153025599729088 | Quoted successfully but did not win the optimizer objective. |
| 9500 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4112804960264364655058 | Quoted successfully but did not win the optimizer objective. |
| 10000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame | 4111092706096947135590 | Quoted successfully but did not win the optimizer objective. |

### Edge Matrix

| Status | Edge | Venue | Pool | Reason |
| --- | --- | --- | --- | --- |
| rejected | ETH->WETH | NativeWrap | native-wrap-weth | No recorded quote evidence for uniswap-v4-usdc-eth at input 1000000. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 | UniswapV4 | uniswap-v4-basedflick-zora | Edge appears in at least one generated executable candidate. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->WETH | Slipstream | slipstream-zora-weth | Edge appears in at least one generated executable candidate. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->WETH | UniswapV3 | uniswap-v3-zora-weth | Edge appears in at least one generated executable candidate. |
| considered | 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME | Slipstream | slipstream-basedflick-fame | Edge appears in at least one generated executable candidate. |
| disabled | WETH->USDC | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | WETH->USDC | Solidly | missing | No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe. |
| considered | WETH->FAME | Solidly | scale-equalizer-weth-fame | Edge appears in at least one generated executable candidate. |
| considered | WETH->FAME | UniswapV2 | uniswap-v2-fame-direct | Edge appears in at least one generated executable candidate. |
| considered | 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME | Solidly | scale-equalizer-scale-fame | Edge appears in at least one generated executable candidate. |
| rejected | USDC->ETH | UniswapV4 | uniswap-v4-usdc-eth | No recorded quote evidence for uniswap-v4-usdc-eth at input 1000000. |
| considered | USDC->0x1111111111166b7fe7bd91427724b487980afc69 | Slipstream | slipstream-zora-usdc | Edge appears in at least one generated executable candidate. |
| considered | USDC->0x1111111111166b7fe7bd91427724b487980afc69 | UniswapV3 | uniswap-v3-zora-usdc | Edge appears in at least one generated executable candidate. |
| considered | USDC->WETH | AerodromeV2 | aerodrome-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| considered | USDC->WETH | Slipstream | slipstream-usdc-weth-100 | Edge appears in at least one generated executable candidate. |
| disabled | USDC->WETH | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | USDC->WETH | Solidly | missing | No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe. |
| considered | USDC->WETH | UniswapV2 | uniswap-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| considered | USDC->WETH | UniswapV3 | uniswap-v3-usdc-weth-30bps | Edge appears in at least one generated executable candidate. |
| considered | USDC->WETH | UniswapV3 | uniswap-v3-usdc-weth-5bps | Edge appears in at least one generated executable candidate. |
| considered | USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c | Solidly | scale-equalizer-usdc-scale | Edge appears in at least one generated executable candidate. |
| selected | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Slipstream | slipstream-usdc-frxusd | Edge is part of the selected ready route. |
| considered | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Solidly | scale-equalizer-usdc-frxusd | Edge appears in at least one generated executable candidate. |
| selected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME | Solidly | scale-equalizer-frxusd-fame | Edge is part of the selected ready route. |

### Protocol Coverage

| Edge | Status | Quote | Pre | Post | Impact | Active Liquidity | Simulation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ETH->WETH native-wrap-weth | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 1000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 1000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 1000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 1000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 1000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 uniswap-v4-basedflick-zora | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->WETH slipstream-zora-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->WETH uniswap-v3-zora-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME slipstream-basedflick-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| WETH->USDC missing | missing/missing_edge | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| WETH->FAME scale-equalizer-weth-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->FAME uniswap-v2-fame-direct | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME scale-equalizer-scale-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->ETH uniswap-v4-usdc-eth | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 1000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 1000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 1000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 1000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 1000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0x1111111111166b7fe7bd91427724b487980afc69 slipstream-zora-usdc | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0x1111111111166b7fe7bd91427724b487980afc69 uniswap-v3-zora-usdc | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH aerodrome-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-100 | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| USDC->WETH missing | missing/missing_edge | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| USDC->WETH uniswap-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH uniswap-v3-usdc-weth-30bps | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH uniswap-v3-usdc-weth-5bps | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c scale-equalizer-usdc-scale | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 slipstream-usdc-frxusd | selected/selected_leg | available 1000238483906584419 | available 1000339786569469890916631437243 | available 1000337248948859955232018644407 | available 1 | not_applicable (Recorded active liquidity evidence is not applicable for this adapter.) | unavailable (Indexed route lab does not run live route simulation.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 scale-equalizer-usdc-frxusd | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME scale-equalizer-frxusd-fame | selected/selected_leg | available 4209445937230342691529 | available 4253200147033223697182 | available 4248681974269950817704 | available 105 | not_applicable (Constant-product reserve replay uses reserves, not V4 active liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |

### Suggested Contract Todo

# Prove USDC->FAME Route For 1000000

## Evidence
- www route-lab case: usdc-fame-fixture
- Pair: USDC->FAME
- Amount in: 1000000
- Selected pools: slipstream-usdc-frxusd, scale-equalizer-frxusd-fame
- Quote context: unavailable
- Router fee amount: 9353388872525821460

## Acceptance Criteria
- [ ] Add or update contract-repo fork evidence for this exact amount and pool set.
- [ ] Capture selected-pool capacity or route artifact metadata if the route should become launch evidence.

## usdc-fame-five-dollars

- Mode: indexed
- Pair: USDC->FAME
- Amount in: 5000000
- Status: ready
- Expected: ready
- Selected pools: slipstream-usdc-frxusd, scale-equalizer-frxusd-fame
- Quote context: n/a
- Router fee amount: 46668028629238696544
- Venue fees included in quotes: true
- Computable price-impact legs: 2
- Max leg market impact bps: 126
- Rejections: 260
- Candidate generation diagnostics: 1
- Optimizer: selected, allocation n/a, trials 306, cache hits 125
- Indexed pool state: fresh 7, stale 0, unknown 1, unsupported 12, max freshness 120
- Edge matrix: selected 2, considered 16, rejected 2, disabled 2, missing 2
- Protocol coverage: selected 2, considered 16, rejected 2, disabled 2, missing 2
- Simulation: Indexed route lab does not run live route simulation.

### Candidate Generation Diagnostics

- split_candidate_budget_exceeded: Split candidate generation stopped after 40 split candidates.

### Optimizer

- Status: selected
- Selected template: single-solver-single_path-slipstream-usdc-frxusd--scale-equalizer-frxusd-fame
- Selected allocation bps: n/a
- Selected allocation vector: n/a
- Selected algorithm: n/a
- Selected stop reason: n/a
- Selected candidate: solver-single_path-slipstream-usdc-frxusd--scale-equalizer-frxusd-fame
- Fallback reason: n/a
- Trial statuses: selected 0, rejected 54, pruned 8, budget_exhausted 179, quote_failed 73, unsupported_shape 0, ineligible 4
- Quote plan stats: logical 320, unique exact 144, exact cache hits 125, unique state 0, state cache hits 0, rpc 0

| Allocation | Algorithm | Stop | Status | Pools | Protected | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| n/a | local_math | unsupported_protocol | ineligible | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | n/a | Local marginal-price allocation requires an explicit adapter capability with complete pinned-block state. |
| 0 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, uniswap-v2-fame-direct | 20721003081612905763976 | Quoted successfully but did not win the optimizer objective. |
| 500 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 20712987638196454613586 | Quoted successfully but did not win the optimizer objective. |
| 1000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 20704920671046741948666 | Quoted successfully but did not win the optimizer objective. |
| 2000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 20688632167138819536061 | Quoted successfully but did not win the optimizer objective. |
| 3500 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 20663812993220408260359 | Quoted successfully but did not win the optimizer objective. |
| 5000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 20638530127172332911240 | Quoted successfully but did not win the optimizer objective. |
| 6500 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 20612783579717643942229 | Quoted successfully but did not win the optimizer objective. |
| 8000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 20586573361571330317554 | Quoted successfully but did not win the optimizer objective. |
| 9000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 20568842293266144603661 | Quoted successfully but did not win the optimizer objective. |
| 9500 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 20559899483440320413407 | Quoted successfully but did not win the optimizer objective. |
| 10000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame | 20550905157027248262207 | Quoted successfully but did not win the optimizer objective. |

### Edge Matrix

| Status | Edge | Venue | Pool | Reason |
| --- | --- | --- | --- | --- |
| rejected | ETH->WETH | NativeWrap | native-wrap-weth | No recorded quote evidence for uniswap-v4-usdc-eth at input 5000000. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 | UniswapV4 | uniswap-v4-basedflick-zora | Edge appears in at least one generated executable candidate. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->WETH | Slipstream | slipstream-zora-weth | Edge appears in at least one generated executable candidate. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->WETH | UniswapV3 | uniswap-v3-zora-weth | Edge appears in at least one generated executable candidate. |
| considered | 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME | Slipstream | slipstream-basedflick-fame | Edge appears in at least one generated executable candidate. |
| disabled | WETH->USDC | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | WETH->USDC | Solidly | missing | No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe. |
| considered | WETH->FAME | Solidly | scale-equalizer-weth-fame | Edge appears in at least one generated executable candidate. |
| considered | WETH->FAME | UniswapV2 | uniswap-v2-fame-direct | Edge appears in at least one generated executable candidate. |
| considered | 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME | Solidly | scale-equalizer-scale-fame | Edge appears in at least one generated executable candidate. |
| rejected | USDC->ETH | UniswapV4 | uniswap-v4-usdc-eth | No recorded quote evidence for uniswap-v4-usdc-eth at input 5000000. |
| considered | USDC->0x1111111111166b7fe7bd91427724b487980afc69 | Slipstream | slipstream-zora-usdc | Edge appears in at least one generated executable candidate. |
| considered | USDC->0x1111111111166b7fe7bd91427724b487980afc69 | UniswapV3 | uniswap-v3-zora-usdc | Edge appears in at least one generated executable candidate. |
| considered | USDC->WETH | AerodromeV2 | aerodrome-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| considered | USDC->WETH | Slipstream | slipstream-usdc-weth-100 | Edge appears in at least one generated executable candidate. |
| disabled | USDC->WETH | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | USDC->WETH | Solidly | missing | No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe. |
| considered | USDC->WETH | UniswapV2 | uniswap-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| considered | USDC->WETH | UniswapV3 | uniswap-v3-usdc-weth-30bps | Edge appears in at least one generated executable candidate. |
| considered | USDC->WETH | UniswapV3 | uniswap-v3-usdc-weth-5bps | Edge appears in at least one generated executable candidate. |
| considered | USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c | Solidly | scale-equalizer-usdc-scale | Edge appears in at least one generated executable candidate. |
| selected | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Slipstream | slipstream-usdc-frxusd | Edge is part of the selected ready route. |
| considered | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Solidly | scale-equalizer-usdc-frxusd | Edge appears in at least one generated executable candidate. |
| selected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME | Solidly | scale-equalizer-frxusd-fame | Edge is part of the selected ready route. |

### Protocol Coverage

| Edge | Status | Quote | Pre | Post | Impact | Active Liquidity | Simulation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ETH->WETH native-wrap-weth | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 5000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 5000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 5000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 5000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 5000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 uniswap-v4-basedflick-zora | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->WETH slipstream-zora-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->WETH uniswap-v3-zora-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME slipstream-basedflick-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| WETH->USDC missing | missing/missing_edge | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| WETH->FAME scale-equalizer-weth-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->FAME uniswap-v2-fame-direct | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME scale-equalizer-scale-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->ETH uniswap-v4-usdc-eth | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 5000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 5000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 5000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 5000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 5000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0x1111111111166b7fe7bd91427724b487980afc69 slipstream-zora-usdc | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0x1111111111166b7fe7bd91427724b487980afc69 uniswap-v3-zora-usdc | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH aerodrome-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-100 | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| USDC->WETH missing | missing/missing_edge | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| USDC->WETH uniswap-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH uniswap-v3-usdc-weth-30bps | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH uniswap-v3-usdc-weth-5bps | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c scale-equalizer-usdc-scale | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 slipstream-usdc-frxusd | selected/selected_leg | available 5001167046009268183 | available 1000339786569469890916631437243 | available 1000327098562979565743895686313 | available 1 | not_applicable (Recorded active liquidity evidence is not applicable for this adapter.) | unavailable (Indexed route lab does not run live route simulation.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 scale-equalizer-usdc-frxusd | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME scale-equalizer-frxusd-fame | selected/selected_leg | available 21002713154472860730887 | available 4253200147033223697182 | available 4230681201673591209612 | available 126 | not_applicable (Constant-product reserve replay uses reserves, not V4 active liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |

### Suggested Contract Todo

# Prove USDC->FAME Route For 5000000

## Evidence
- www route-lab case: usdc-fame-five-dollars
- Pair: USDC->FAME
- Amount in: 5000000
- Selected pools: slipstream-usdc-frxusd, scale-equalizer-frxusd-fame
- Quote context: unavailable
- Router fee amount: 46668028629238696544

## Acceptance Criteria
- [ ] Add or update contract-repo fork evidence for this exact amount and pool set.
- [ ] Capture selected-pool capacity or route artifact metadata if the route should become launch evidence.

## usdc-fame-large-closed

- Mode: indexed
- Pair: USDC->FAME
- Amount in: 2000000
- Status: ready
- Expected: ready
- Selected pools: slipstream-usdc-frxusd, scale-equalizer-frxusd-fame
- Quote context: n/a
- Router fee amount: 18696870455695563695
- Venue fees included in quotes: true
- Computable price-impact legs: 2
- Max leg market impact bps: 110
- Rejections: 260
- Candidate generation diagnostics: 1
- Optimizer: selected, allocation n/a, trials 306, cache hits 125
- Indexed pool state: fresh 7, stale 0, unknown 1, unsupported 12, max freshness 120
- Edge matrix: selected 2, considered 16, rejected 2, disabled 2, missing 2
- Protocol coverage: selected 2, considered 16, rejected 2, disabled 2, missing 2
- Simulation: Indexed route lab does not run live route simulation.

### Candidate Generation Diagnostics

- split_candidate_budget_exceeded: Split candidate generation stopped after 40 split candidates.

### Optimizer

- Status: selected
- Selected template: single-solver-single_path-slipstream-usdc-frxusd--scale-equalizer-frxusd-fame
- Selected allocation bps: n/a
- Selected allocation vector: n/a
- Selected algorithm: n/a
- Selected stop reason: n/a
- Selected candidate: solver-single_path-slipstream-usdc-frxusd--scale-equalizer-frxusd-fame
- Fallback reason: n/a
- Trial statuses: selected 0, rejected 54, pruned 8, budget_exhausted 179, quote_failed 73, unsupported_shape 0, ineligible 4
- Quote plan stats: logical 320, unique exact 144, exact cache hits 125, unique state 0, state cache hits 0, rpc 0

| Allocation | Algorithm | Stop | Status | Pools | Protected | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| n/a | local_math | unsupported_protocol | ineligible | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | n/a | Local marginal-price allocation requires an explicit adapter capability with complete pinned-block state. |
| 0 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, uniswap-v2-fame-direct | 8289519435845612876729 | Quoted successfully but did not win the optimizer objective. |
| 500 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 8286208268278791362346 | Quoted successfully but did not win the optimizer objective. |
| 1000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 8282888855372605874644 | Quoted successfully but did not win the optimizer objective. |
| 2000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 8276225293643905608518 | Quoted successfully but did not win the optimizer objective. |
| 3500 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 8266168111641575485625 | Quoted successfully but did not win the optimizer objective. |
| 5000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 8256036722958441002476 | Quoted successfully but did not win the optimizer objective. |
| 6500 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 8245831128280935927410 | Quoted successfully but did not win the optimizer objective. |
| 8000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 8235551328295287508310 | Quoted successfully but did not win the optimizer objective. |
| 9000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 8228656903472448733140 | Quoted successfully but did not win the optimizer objective. |
| 9500 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 8225197323687516624415 | Quoted successfully but did not win the optimizer objective. |
| 10000 | grid | grid_complete | rejected | aerodrome-v2-usdc-weth, scale-equalizer-weth-fame | 8221729499020774121655 | Quoted successfully but did not win the optimizer objective. |

### Edge Matrix

| Status | Edge | Venue | Pool | Reason |
| --- | --- | --- | --- | --- |
| rejected | ETH->WETH | NativeWrap | native-wrap-weth | No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 | UniswapV4 | uniswap-v4-basedflick-zora | Edge appears in at least one generated executable candidate. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->WETH | Slipstream | slipstream-zora-weth | Edge appears in at least one generated executable candidate. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->WETH | UniswapV3 | uniswap-v3-zora-weth | Edge appears in at least one generated executable candidate. |
| considered | 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME | Slipstream | slipstream-basedflick-fame | Edge appears in at least one generated executable candidate. |
| disabled | WETH->USDC | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | WETH->USDC | Solidly | missing | No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe. |
| considered | WETH->FAME | Solidly | scale-equalizer-weth-fame | Edge appears in at least one generated executable candidate. |
| considered | WETH->FAME | UniswapV2 | uniswap-v2-fame-direct | Edge appears in at least one generated executable candidate. |
| considered | 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME | Solidly | scale-equalizer-scale-fame | Edge appears in at least one generated executable candidate. |
| rejected | USDC->ETH | UniswapV4 | uniswap-v4-usdc-eth | No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000. |
| considered | USDC->0x1111111111166b7fe7bd91427724b487980afc69 | Slipstream | slipstream-zora-usdc | Edge appears in at least one generated executable candidate. |
| considered | USDC->0x1111111111166b7fe7bd91427724b487980afc69 | UniswapV3 | uniswap-v3-zora-usdc | Edge appears in at least one generated executable candidate. |
| considered | USDC->WETH | AerodromeV2 | aerodrome-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| considered | USDC->WETH | Slipstream | slipstream-usdc-weth-100 | Edge appears in at least one generated executable candidate. |
| disabled | USDC->WETH | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | USDC->WETH | Solidly | missing | No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe. |
| considered | USDC->WETH | UniswapV2 | uniswap-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| considered | USDC->WETH | UniswapV3 | uniswap-v3-usdc-weth-30bps | Edge appears in at least one generated executable candidate. |
| considered | USDC->WETH | UniswapV3 | uniswap-v3-usdc-weth-5bps | Edge appears in at least one generated executable candidate. |
| considered | USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c | Solidly | scale-equalizer-usdc-scale | Edge appears in at least one generated executable candidate. |
| selected | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Slipstream | slipstream-usdc-frxusd | Edge is part of the selected ready route. |
| considered | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Solidly | scale-equalizer-usdc-frxusd | Edge appears in at least one generated executable candidate. |
| selected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME | Solidly | scale-equalizer-frxusd-fame | Edge is part of the selected ready route. |

### Protocol Coverage

| Edge | Status | Quote | Pre | Post | Impact | Active Liquidity | Simulation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ETH->WETH native-wrap-weth | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 uniswap-v4-basedflick-zora | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->WETH slipstream-zora-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->WETH uniswap-v3-zora-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME slipstream-basedflick-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| WETH->USDC missing | missing/missing_edge | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| WETH->FAME scale-equalizer-weth-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->FAME uniswap-v2-fame-direct | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME scale-equalizer-scale-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->ETH uniswap-v4-usdc-eth | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0x1111111111166b7fe7bd91427724b487980afc69 slipstream-zora-usdc | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0x1111111111166b7fe7bd91427724b487980afc69 uniswap-v3-zora-usdc | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH aerodrome-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-100 | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| USDC->WETH missing | missing/missing_edge | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| USDC->WETH uniswap-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH uniswap-v3-usdc-weth-30bps | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH uniswap-v3-usdc-weth-5bps | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c scale-equalizer-usdc-scale | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 slipstream-usdc-frxusd | selected/selected_leg | available 2000474430451148478 | available 1000339786569469890916631437243 | available 1000334711337906003861962589364 | available 1 | not_applicable (Recorded active liquidity evidence is not applicable for this adapter.) | unavailable (Indexed route lab does not run live route simulation.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 scale-equalizer-usdc-frxusd | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME scale-equalizer-frxusd-fame | selected/selected_leg | available 8414433148377841447092 | available 4253200147033223697182 | available 4244171008658679473285 | available 110 | not_applicable (Constant-product reserve replay uses reserves, not V4 active liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |

### Suggested Contract Todo

# Prove USDC->FAME Route For 2000000

## Evidence
- www route-lab case: usdc-fame-large-closed
- Pair: USDC->FAME
- Amount in: 2000000
- Selected pools: slipstream-usdc-frxusd, scale-equalizer-frxusd-fame
- Quote context: unavailable
- Router fee amount: 18696870455695563695

## Acceptance Criteria
- [ ] Add or update contract-repo fork evidence for this exact amount and pool set.
- [ ] Capture selected-pool capacity or route artifact metadata if the route should become launch evidence.

## fame-usdc-fixture

- Mode: indexed
- Pair: FAME->USDC
- Amount in: 31597600141347829
- Status: ready
- Expected: ready
- Selected pools: scale-equalizer-weth-fame, aerodrome-v2-usdc-weth
- Quote context: indexed:8453:46312158:fresh 7, stale 0, unknown 1, unsupported 12
- Router fee amount: 0
- Venue fees included in quotes: true
- Computable price-impact legs: 2
- Max leg market impact bps: 563
- Rejections: 318
- Candidate generation diagnostics: 0
- Optimizer: selected, allocation 10000, algorithm grid, stop grid_complete, trials 313, cache hits 194
- Indexed pool state: fresh 7, stale 0, unknown 1, unsupported 12, max freshness 120
- Edge matrix: selected 2, considered 11, rejected 7, disabled 2, missing 2
- Protocol coverage: selected 2, considered 11, rejected 7, disabled 2, missing 2
- Simulation: Indexed route lab does not run live route simulation.

### Optimizer

- Status: selected
- Selected template: terminal-split-scale-equalizer-weth-fame--aerodrome-v2-usdc-weth--slipstream-usdc-weth-100
- Selected allocation bps: 10000
- Selected allocation vector: n/a
- Selected algorithm: grid
- Selected stop reason: grid_complete
- Selected candidate: optimizer-terminal-split-scale-equalizer-weth-fame--aerodrome-v2-usdc-weth--slipstream-usdc-weth-100-10000bps
- Fallback reason: n/a
- Trial statuses: selected 2, rejected 12, pruned 16, budget_exhausted 205, quote_failed 94, unsupported_shape 0, ineligible 4
- Quote plan stats: logical 320, unique exact 118, exact cache hits 194, unique state 0, state cache hits 0, rpc 0

| Allocation | Algorithm | Stop | Status | Pools | Protected | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 3334/3333/3333 | coordinate_descent | convergence | quote_failed | scale-equalizer-weth-fame, aerodrome-v2-usdc-weth, slipstream-usdc-weth-100, uniswap-v2-usdc-weth | n/a | No recorded quote evidence for slipstream-usdc-weth-100 at input 1159503774. |
| 3334/3333/3333 | coordinate_descent | convergence | quote_failed | uniswap-v2-fame-direct, aerodrome-v2-usdc-weth, slipstream-usdc-weth-100, uniswap-v2-usdc-weth | n/a | No recorded quote evidence for slipstream-usdc-weth-100 at input 1166366470. |
| 0 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, slipstream-usdc-frxusd | n/a | No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238. |
| 500 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 367742205111. |
| 1000 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 735484410223. |
| 2000 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 1470968820447. |
| 3500 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 2574195435783. |
| 5000 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 3677422051119. |
| 6500 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 4780648666454. |
| 8000 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 5883875281790. |
| 9000 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 6619359692014. |
| 9500 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 6987101897126. |

### Edge Matrix

| Status | Edge | Venue | Pool | Reason |
| --- | --- | --- | --- | --- |
| rejected | ETH->USDC | UniswapV4 | uniswap-v4-usdc-eth | No recorded quote evidence for uniswap-v4-usdc-eth at input 3478859208. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->USDC | Slipstream | slipstream-zora-usdc | Edge appears in at least one generated executable candidate. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->USDC | UniswapV3 | uniswap-v3-zora-usdc | Edge appears in at least one generated executable candidate. |
| considered | 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->0x1111111111166b7fe7bd91427724b487980afc69 | UniswapV4 | uniswap-v4-basedflick-zora | Edge appears in at least one generated executable candidate. |
| rejected | WETH->ETH | NativeWrap | native-wrap-weth | No recorded quote evidence for uniswap-v4-usdc-eth at input 3478859208. |
| rejected | WETH->0x1111111111166b7fe7bd91427724b487980afc69 | Slipstream | slipstream-zora-weth | No recorded quote evidence for slipstream-zora-weth at input 3478859208. |
| rejected | WETH->0x1111111111166b7fe7bd91427724b487980afc69 | UniswapV3 | uniswap-v3-zora-weth | No recorded quote evidence for uniswap-v3-zora-weth at input 3478859208. |
| selected | WETH->USDC | AerodromeV2 | aerodrome-v2-usdc-weth | Edge is part of the selected ready route. |
| considered | WETH->USDC | Slipstream | slipstream-usdc-weth-100 | Edge appears in at least one generated executable candidate. |
| disabled | WETH->USDC | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | WETH->USDC | Solidly | missing | No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe. |
| considered | WETH->USDC | UniswapV2 | uniswap-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| considered | WETH->USDC | UniswapV3 | uniswap-v3-usdc-weth-30bps | Edge appears in at least one generated executable candidate. |
| considered | WETH->USDC | UniswapV3 | uniswap-v3-usdc-weth-5bps | Edge appears in at least one generated executable candidate. |
| considered | 0x54016a4848a38f257b6e96331f7404073fd9c32c->USDC | Solidly | scale-equalizer-usdc-scale | Edge appears in at least one generated executable candidate. |
| disabled | USDC->WETH | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | USDC->WETH | Solidly | missing | No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe. |
| rejected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC | Slipstream | slipstream-usdc-frxusd | No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238. |
| rejected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC | Solidly | scale-equalizer-usdc-frxusd | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238. |
| considered | FAME->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 | Slipstream | slipstream-basedflick-fame | Edge appears in at least one generated executable candidate. |
| selected | FAME->WETH | Solidly | scale-equalizer-weth-fame | Edge is part of the selected ready route. |
| considered | FAME->WETH | UniswapV2 | uniswap-v2-fame-direct | Edge appears in at least one generated executable candidate. |
| considered | FAME->0x54016a4848a38f257b6e96331f7404073fd9c32c | Solidly | scale-equalizer-scale-fame | Edge appears in at least one generated executable candidate. |
| rejected | FAME->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Solidly | scale-equalizer-frxusd-fame | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238. |

### Protocol Coverage

| Edge | Status | Quote | Pre | Post | Impact | Active Liquidity | Simulation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ETH->USDC uniswap-v4-usdc-eth | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478859208.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->USDC slipstream-zora-usdc | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->USDC uniswap-v3-zora-usdc | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->0x1111111111166b7fe7bd91427724b487980afc69 uniswap-v4-basedflick-zora | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->ETH native-wrap-weth | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478859208.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->0x1111111111166b7fe7bd91427724b487980afc69 slipstream-zora-weth | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 3478859208.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->0x1111111111166b7fe7bd91427724b487980afc69 uniswap-v3-zora-weth | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 3478859208.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC aerodrome-v2-usdc-weth | selected/selected_leg | available 7 | available 2132409252 | available 2132409252 | available 563 | not_applicable (Constant-product reserve replay uses reserves, not V4 active liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |
| WETH->USDC slipstream-usdc-weth-100 | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| WETH->USDC missing | missing/missing_edge | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| WETH->USDC uniswap-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC uniswap-v3-usdc-weth-30bps | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC uniswap-v3-usdc-weth-5bps | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x54016a4848a38f257b6e96331f7404073fd9c32c->USDC scale-equalizer-usdc-scale | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| USDC->WETH missing | missing/missing_edge | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC slipstream-usdc-frxusd | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC scale-equalizer-usdc-frxusd | rejected/candidate_rejection | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 slipstream-basedflick-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->WETH scale-equalizer-weth-fame | selected/selected_leg | available 3478859208 | available 111210952280 | available 111210952188 | available 100 | not_applicable (Constant-product reserve replay uses reserves, not V4 active liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |
| FAME->WETH uniswap-v2-fame-direct | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->0x54016a4848a38f257b6e96331f7404073fd9c32c scale-equalizer-scale-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->0xe5020a6d073a794b6e7f05678707de47986fb0b6 scale-equalizer-frxusd-fame | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | not_applicable (Only the selected ready route is route-simulated.) |

### Suggested Contract Todo

# Prove FAME->USDC Route For 31597600141347829

## Evidence
- www route-lab case: fame-usdc-fixture
- Pair: FAME->USDC
- Amount in: 31597600141347829
- Selected pools: scale-equalizer-weth-fame, aerodrome-v2-usdc-weth
- Quote context: indexed:8453:46312158:fresh 7, stale 0, unknown 1, unsupported 12
- Router fee amount: 0

## Acceptance Criteria
- [ ] Add or update contract-repo fork evidence for this exact amount and pool set.
- [ ] Capture selected-pool capacity or route artifact metadata if the route should become launch evidence.

## fame-usdc-large-closed

- Mode: indexed
- Pair: FAME->USDC
- Amount in: 31597600141347829000
- Status: ready
- Expected: ready
- Selected pools: uniswap-v2-fame-direct, uniswap-v2-usdc-weth
- Quote context: indexed:8453:46312158:fresh 7, stale 0, unknown 1, unsupported 12
- Router fee amount: 16
- Venue fees included in quotes: true
- Computable price-impact legs: 2
- Max leg market impact bps: 30
- Rejections: 311
- Candidate generation diagnostics: 0
- Optimizer: selected, allocation n/a, trials 310, cache hits 182
- Indexed pool state: fresh 7, stale 0, unknown 1, unsupported 12, max freshness 120
- Edge matrix: selected 2, considered 11, rejected 7, disabled 2, missing 2
- Protocol coverage: selected 2, considered 11, rejected 7, disabled 2, missing 2
- Simulation: Indexed route lab does not run live route simulation.

### Optimizer

- Status: selected
- Selected template: single-solver-single_path-uniswap-v2-fame-direct--uniswap-v2-usdc-weth
- Selected allocation bps: n/a
- Selected allocation vector: n/a
- Selected algorithm: n/a
- Selected stop reason: n/a
- Selected candidate: solver-single_path-uniswap-v2-fame-direct--uniswap-v2-usdc-weth
- Fallback reason: n/a
- Trial statuses: selected 0, rejected 17, pruned 16, budget_exhausted 206, quote_failed 87, unsupported_shape 0, ineligible 4
- Quote plan stats: logical 320, unique exact 124, exact cache hits 182, unique state 0, state cache hits 0, rpc 0

| Allocation | Algorithm | Stop | Status | Pools | Protected | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 3334/3333/3333 | coordinate_descent | convergence | quote_failed | scale-equalizer-weth-fame, aerodrome-v2-usdc-weth, slipstream-usdc-weth-100, uniswap-v2-usdc-weth | n/a | No recorded quote evidence for slipstream-usdc-weth-100 at input 1159503293471. |
| 3334/3333/3333 | coordinate_descent | convergence | quote_failed | uniswap-v2-fame-direct, aerodrome-v2-usdc-weth, slipstream-usdc-weth-100, uniswap-v2-usdc-weth | n/a | No recorded quote evidence for slipstream-usdc-weth-100 at input 1166366079045. |
| 0 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, slipstream-usdc-frxusd | n/a | No recorded quote evidence for slipstream-usdc-frxusd at input 7354815238852238. |
| 500 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 367740761942611. |
| 1000 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 735481523885223. |
| 2000 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 1470963047770447. |
| 3500 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 2574185333598283. |
| 5000 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 3677407619426119. |
| 6500 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 4780629905253954. |
| 8000 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 5883852191081790. |
| 9000 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 6619333714967014. |
| 9500 | grid | grid_complete | quote_failed | scale-equalizer-frxusd-fame, scale-equalizer-usdc-frxusd, slipstream-usdc-frxusd | n/a | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 6987074476909626. |

### Edge Matrix

| Status | Edge | Venue | Pool | Reason |
| --- | --- | --- | --- | --- |
| rejected | ETH->USDC | UniswapV4 | uniswap-v4-usdc-eth | No recorded quote evidence for uniswap-v4-usdc-eth at input 3478857766189. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->USDC | Slipstream | slipstream-zora-usdc | Edge appears in at least one generated executable candidate. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->USDC | UniswapV3 | uniswap-v3-zora-usdc | Edge appears in at least one generated executable candidate. |
| considered | 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->0x1111111111166b7fe7bd91427724b487980afc69 | UniswapV4 | uniswap-v4-basedflick-zora | Edge appears in at least one generated executable candidate. |
| rejected | WETH->ETH | NativeWrap | native-wrap-weth | No recorded quote evidence for uniswap-v4-usdc-eth at input 3478857766189. |
| rejected | WETH->0x1111111111166b7fe7bd91427724b487980afc69 | Slipstream | slipstream-zora-weth | No recorded quote evidence for slipstream-zora-weth at input 3478857766189. |
| rejected | WETH->0x1111111111166b7fe7bd91427724b487980afc69 | UniswapV3 | uniswap-v3-zora-weth | No recorded quote evidence for uniswap-v3-zora-weth at input 3478857766189. |
| considered | WETH->USDC | AerodromeV2 | aerodrome-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| considered | WETH->USDC | Slipstream | slipstream-usdc-weth-100 | Edge appears in at least one generated executable candidate. |
| disabled | WETH->USDC | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | WETH->USDC | Solidly | missing | No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe. |
| selected | WETH->USDC | UniswapV2 | uniswap-v2-usdc-weth | Edge is part of the selected ready route. |
| considered | WETH->USDC | UniswapV3 | uniswap-v3-usdc-weth-30bps | Edge appears in at least one generated executable candidate. |
| considered | WETH->USDC | UniswapV3 | uniswap-v3-usdc-weth-5bps | Edge appears in at least one generated executable candidate. |
| considered | 0x54016a4848a38f257b6e96331f7404073fd9c32c->USDC | Solidly | scale-equalizer-usdc-scale | Edge appears in at least one generated executable candidate. |
| disabled | USDC->WETH | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | USDC->WETH | Solidly | missing | No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe. |
| rejected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC | Slipstream | slipstream-usdc-frxusd | No recorded quote evidence for slipstream-usdc-frxusd at input 7354815238852238. |
| rejected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC | Solidly | scale-equalizer-usdc-frxusd | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354815238852238. |
| considered | FAME->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 | Slipstream | slipstream-basedflick-fame | Edge appears in at least one generated executable candidate. |
| considered | FAME->WETH | Solidly | scale-equalizer-weth-fame | Edge appears in at least one generated executable candidate. |
| selected | FAME->WETH | UniswapV2 | uniswap-v2-fame-direct | Edge is part of the selected ready route. |
| considered | FAME->0x54016a4848a38f257b6e96331f7404073fd9c32c | Solidly | scale-equalizer-scale-fame | Edge appears in at least one generated executable candidate. |
| rejected | FAME->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Solidly | scale-equalizer-frxusd-fame | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354815238852238. |

### Protocol Coverage

| Edge | Status | Quote | Pre | Post | Impact | Active Liquidity | Simulation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ETH->USDC uniswap-v4-usdc-eth | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478857766189.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478857766189.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478857766189.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478857766189.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478857766189.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->USDC slipstream-zora-usdc | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->USDC uniswap-v3-zora-usdc | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->0x1111111111166b7fe7bd91427724b487980afc69 uniswap-v4-basedflick-zora | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->ETH native-wrap-weth | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478857766189.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478857766189.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478857766189.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478857766189.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 3478857766189.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->0x1111111111166b7fe7bd91427724b487980afc69 slipstream-zora-weth | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-zora-weth at input 3478857766189.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 3478857766189.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 3478857766189.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 3478857766189.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 3478857766189.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->0x1111111111166b7fe7bd91427724b487980afc69 uniswap-v3-zora-weth | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 3478857766189.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 3478857766189.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 3478857766189.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 3478857766189.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 3478857766189.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC aerodrome-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-100 | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| WETH->USDC missing | missing/missing_edge | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| WETH->USDC uniswap-v2-usdc-weth | selected/selected_leg | available 7441 | available 2132756618 | available 2132756575 | available 30 | not_applicable (Constant-product reserve replay uses reserves, not V4 active liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |
| WETH->USDC uniswap-v3-usdc-weth-30bps | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC uniswap-v3-usdc-weth-5bps | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x54016a4848a38f257b6e96331f7404073fd9c32c->USDC scale-equalizer-usdc-scale | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| USDC->WETH missing | missing/missing_edge | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC slipstream-usdc-frxusd | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354815238852238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354815238852238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354815238852238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354815238852238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354815238852238.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC scale-equalizer-usdc-frxusd | rejected/candidate_rejection | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354815238852238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354815238852238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354815238852238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354815238852238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354815238852238.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 slipstream-basedflick-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->WETH scale-equalizer-weth-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->WETH uniswap-v2-fame-direct | selected/selected_leg | available 3499448181952 | available 111083730377 | available 111083655678 | available 30 | not_applicable (Constant-product reserve replay uses reserves, not V4 active liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |
| FAME->0x54016a4848a38f257b6e96331f7404073fd9c32c scale-equalizer-scale-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->0xe5020a6d073a794b6e7f05678707de47986fb0b6 scale-equalizer-frxusd-fame | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354815238852238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354815238852238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354815238852238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354815238852238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354815238852238.) | not_applicable (Only the selected ready route is route-simulated.) |

### Suggested Contract Todo

# Prove FAME->USDC Route For 31597600141347829000

## Evidence
- www route-lab case: fame-usdc-large-closed
- Pair: FAME->USDC
- Amount in: 31597600141347829000
- Selected pools: uniswap-v2-fame-direct, uniswap-v2-usdc-weth
- Quote context: indexed:8453:46312158:fresh 7, stale 0, unknown 1, unsupported 12
- Router fee amount: 16

## Acceptance Criteria
- [ ] Add or update contract-repo fork evidence for this exact amount and pool set.
- [ ] Capture selected-pool capacity or route artifact metadata if the route should become launch evidence.

## weth-fame-small-direct

- Mode: indexed
- Pair: WETH->FAME
- Amount in: 100000000000000
- Status: ready
- Expected: ready
- Selected pools: slipstream-zora-weth, uniswap-v4-basedflick-zora, slipstream-basedflick-fame
- Quote context: recorded:base-v1-live-45964183:45884844
- Router fee amount: 2001545682406733728
- Venue fees included in quotes: true
- Computable price-impact legs: 3
- Max leg market impact bps: 301
- Rejections: 13
- Candidate generation diagnostics: 0
- Optimizer: selected, allocation n/a, trials 14, cache hits 8
- Indexed pool state: fresh 7, stale 0, unknown 1, unsupported 8, max freshness 120
- Edge matrix: selected 3, considered 7, rejected 6, disabled 2, missing 2
- Protocol coverage: selected 3, considered 7, rejected 6, disabled 2, missing 2
- Simulation: Indexed route lab does not run live route simulation.

### Optimizer

- Status: selected
- Selected template: single-solver-single_path-slipstream-zora-weth--uniswap-v4-basedflick-zora--slipstream-basedflick-fame
- Selected allocation bps: n/a
- Selected allocation vector: n/a
- Selected algorithm: n/a
- Selected stop reason: n/a
- Selected candidate: solver-single_path-slipstream-zora-weth--uniswap-v4-basedflick-zora--slipstream-basedflick-fame
- Fallback reason: n/a
- Trial statuses: selected 0, rejected 13, pruned 0, budget_exhausted 0, quote_failed 0, unsupported_shape 0, ineligible 1
- Quote plan stats: logical 58, unique exact 43, exact cache hits 8, unique state 0, state cache hits 0, rpc 0

| Allocation | Algorithm | Stop | Status | Pools | Protected | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| n/a | local_math | unsupported_protocol | ineligible | scale-equalizer-weth-fame, uniswap-v2-fame-direct | n/a | Local marginal-price allocation requires an explicit adapter capability with complete pinned-block state. |
| 0 | grid | grid_complete | rejected | uniswap-v2-fame-direct | 886563132398677948998 | Quoted successfully but did not win the optimizer objective. |
| 500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 886202344970002620338 | Quoted successfully but did not win the optimizer objective. |
| 1000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 885841463233494688003 | Quoted successfully but did not win the optimizer objective. |
| 2000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 885119416837105412839 | Quoted successfully but did not win the optimizer objective. |
| 3500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 884035639934554467102 | Quoted successfully but did not win the optimizer objective. |
| 5000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 882951014263189452966 | Quoted successfully but did not win the optimizer objective. |
| 6500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 881865539823850013263 | Quoted successfully but did not win the optimizer objective. |
| 8000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 880779216617375763813 | Quoted successfully but did not win the optimizer objective. |
| 9000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 880054529609510427192 | Quoted successfully but did not win the optimizer objective. |
| 9500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 879692044644606293430 | Quoted successfully but did not win the optimizer objective. |
| 10000 | grid | grid_complete | rejected | scale-equalizer-weth-fame | 879329465372429308878 | Quoted successfully but did not win the optimizer objective. |

### Edge Matrix

| Status | Edge | Venue | Pool | Reason |
| --- | --- | --- | --- | --- |
| selected | 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 | UniswapV4 | uniswap-v4-basedflick-zora | Edge is part of the selected ready route. |
| selected | 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME | Slipstream | slipstream-basedflick-fame | Edge is part of the selected ready route. |
| selected | WETH->0x1111111111166b7fe7bd91427724b487980afc69 | Slipstream | slipstream-zora-weth | Edge is part of the selected ready route. |
| considered | WETH->0x1111111111166b7fe7bd91427724b487980afc69 | UniswapV3 | uniswap-v3-zora-weth | Edge appears in at least one generated executable candidate. |
| considered | WETH->USDC | AerodromeV2 | aerodrome-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| rejected | WETH->USDC | Slipstream | slipstream-usdc-weth-100 | No recorded quote evidence for slipstream-usdc-weth-100 at input 100000000000000. |
| disabled | WETH->USDC | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | WETH->USDC | Solidly | missing | No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe. |
| considered | WETH->USDC | UniswapV2 | uniswap-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| rejected | WETH->USDC | UniswapV3 | uniswap-v3-usdc-weth-30bps | No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 100000000000000. |
| rejected | WETH->USDC | UniswapV3 | uniswap-v3-usdc-weth-5bps | No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 100000000000000. |
| considered | WETH->FAME | Solidly | scale-equalizer-weth-fame | Edge appears in at least one generated executable candidate. |
| considered | WETH->FAME | UniswapV2 | uniswap-v2-fame-direct | Edge appears in at least one generated executable candidate. |
| considered | 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME | Solidly | scale-equalizer-scale-fame | Edge appears in at least one generated executable candidate. |
| disabled | USDC->WETH | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | USDC->WETH | Solidly | missing | No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe. |
| considered | USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c | Solidly | scale-equalizer-usdc-scale | Edge appears in at least one generated executable candidate. |
| rejected | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Slipstream | slipstream-usdc-frxusd | No recorded quote evidence for slipstream-usdc-frxusd at input 212601. |
| rejected | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Solidly | scale-equalizer-usdc-frxusd | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 212601. |
| rejected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME | Solidly | scale-equalizer-frxusd-fame | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 212601. |

### Protocol Coverage

| Edge | Status | Quote | Pre | Post | Impact | Active Liquidity | Simulation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 uniswap-v4-basedflick-zora | selected/selected_leg | available 30440170661083509412425 | available 1738842407741593134010 | unavailable (Recorded post-price evidence is unavailable.) | available 301 | unavailable (Recorded snapshot does not include V4 StateView.getLiquidity evidence.) | unavailable (Indexed route lab does not run live route simulation.) |
| 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME slipstream-basedflick-fame | selected/selected_leg | available 900785635646594837439 | available 29911818242517843 | available 29870021548376127 | available 106 | not_applicable (Recorded active liquidity evidence is not applicable for this adapter.) | unavailable (Indexed route lab does not run live route simulation.) |
| WETH->0x1111111111166b7fe7bd91427724b487980afc69 slipstream-zora-weth | selected/selected_leg | available 18050693533585036988 | available 180959404145535131999765 | available 180959263194543181972931 | available 25 | not_applicable (Recorded active liquidity evidence is not applicable for this adapter.) | unavailable (Indexed route lab does not run live route simulation.) |
| WETH->0x1111111111166b7fe7bd91427724b487980afc69 uniswap-v3-zora-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC aerodrome-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-100 | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 100000000000000.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 100000000000000.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 100000000000000.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 100000000000000.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 100000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| WETH->USDC missing | missing/missing_edge | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| WETH->USDC uniswap-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC uniswap-v3-usdc-weth-30bps | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 100000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 100000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 100000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 100000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 100000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC uniswap-v3-usdc-weth-5bps | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 100000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 100000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 100000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 100000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 100000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->FAME scale-equalizer-weth-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->FAME uniswap-v2-fame-direct | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME scale-equalizer-scale-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| USDC->WETH missing | missing/missing_edge | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c scale-equalizer-usdc-scale | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 slipstream-usdc-frxusd | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 212601.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 212601.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 212601.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 212601.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 212601.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 scale-equalizer-usdc-frxusd | rejected/candidate_rejection | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 212601.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 212601.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 212601.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 212601.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 212601.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME scale-equalizer-frxusd-fame | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 212601.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 212601.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 212601.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 212601.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 212601.) | not_applicable (Only the selected ready route is route-simulated.) |

### Suggested Contract Todo

# Prove WETH->FAME Route For 100000000000000

## Evidence
- www route-lab case: weth-fame-small-direct
- Pair: WETH->FAME
- Amount in: 100000000000000
- Selected pools: slipstream-zora-weth, uniswap-v4-basedflick-zora, slipstream-basedflick-fame
- Quote context: recorded:base-v1-live-45964183:45884844
- Router fee amount: 2001545682406733728

## Acceptance Criteria
- [ ] Add or update contract-repo fork evidence for this exact amount and pool set.
- [ ] Capture selected-pool capacity or route artifact metadata if the route should become launch evidence.

## weth-fame-split

- Mode: indexed
- Pair: WETH->FAME
- Amount in: 800000000000000
- Status: ready
- Expected: ready
- Selected pools: uniswap-v2-fame-direct
- Quote context: indexed:8453:46312158:fresh 7, stale 0, unknown 1, unsupported 8
- Router fee amount: 15953115660709640094
- Venue fees included in quotes: true
- Computable price-impact legs: 1
- Max leg market impact bps: 30
- Rejections: 13
- Candidate generation diagnostics: 0
- Optimizer: selected, allocation 0, algorithm grid, stop grid_complete, trials 14, cache hits 6
- Indexed pool state: fresh 7, stale 0, unknown 1, unsupported 8, max freshness 120
- Edge matrix: selected 1, considered 9, rejected 6, disabled 2, missing 2
- Protocol coverage: selected 1, considered 9, rejected 6, disabled 2, missing 2
- Simulation: Indexed route lab does not run live route simulation.

### Optimizer

- Status: selected
- Selected template: direct-split-scale-equalizer-weth-fame--uniswap-v2-fame-direct
- Selected allocation bps: 0
- Selected allocation vector: n/a
- Selected algorithm: grid
- Selected stop reason: grid_complete
- Selected candidate: optimizer-direct-split-scale-equalizer-weth-fame--uniswap-v2-fame-direct-10000bps
- Fallback reason: n/a
- Trial statuses: selected 2, rejected 11, pruned 0, budget_exhausted 0, quote_failed 0, unsupported_shape 0, ineligible 1
- Quote plan stats: logical 56, unique exact 43, exact cache hits 6, unique state 0, state cache hits 0, rpc 0

| Allocation | Algorithm | Stop | Status | Pools | Protected | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| n/a | local_math | unsupported_protocol | ineligible | scale-equalizer-weth-fame, uniswap-v2-fame-direct | n/a | Local marginal-price allocation requires an explicit adapter capability with complete pinned-block state. |
| 0 | grid | grid_complete | selected | uniswap-v2-fame-direct | 7092030224722964825080 | Selected by protected-output objective. |
| 500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 7089188766351486490153 | Quoted successfully but did not win the optimizer objective. |
| 1000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 7086341272837621246212 | Quoted successfully but did not win the optimizer objective. |
| 2000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 7080628180446448098401 | Quoted successfully but did not win the optimizer objective. |
| 3500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 7072013278689988632335 | Quoted successfully but did not win the optimizer objective. |
| 5000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 7063344061512066782366 | Quoted successfully but did not win the optimizer objective. |
| 6500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 7054620529342530631869 | Quoted successfully but did not win the optimizer objective. |
| 8000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 7045842682611117660063 | Quoted successfully but did not win the optimizer objective. |
| 9000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 7039960610245743417413 | Quoted successfully but did not win the optimizer objective. |
| 9500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 7037010521747454744896 | Quoted successfully but did not win the optimizer objective. |
| 10000 | grid | grid_complete | selected | scale-equalizer-weth-fame | 7034054398393307686652 | Selected by protected-output objective. |

### Edge Matrix

| Status | Edge | Venue | Pool | Reason |
| --- | --- | --- | --- | --- |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 | UniswapV4 | uniswap-v4-basedflick-zora | Edge appears in at least one generated executable candidate. |
| considered | 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME | Slipstream | slipstream-basedflick-fame | Edge appears in at least one generated executable candidate. |
| considered | WETH->0x1111111111166b7fe7bd91427724b487980afc69 | Slipstream | slipstream-zora-weth | Edge appears in at least one generated executable candidate. |
| considered | WETH->0x1111111111166b7fe7bd91427724b487980afc69 | UniswapV3 | uniswap-v3-zora-weth | Edge appears in at least one generated executable candidate. |
| considered | WETH->USDC | AerodromeV2 | aerodrome-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| rejected | WETH->USDC | Slipstream | slipstream-usdc-weth-100 | No recorded quote evidence for slipstream-usdc-weth-100 at input 800000000000000. |
| disabled | WETH->USDC | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | WETH->USDC | Solidly | missing | No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe. |
| considered | WETH->USDC | UniswapV2 | uniswap-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| rejected | WETH->USDC | UniswapV3 | uniswap-v3-usdc-weth-30bps | No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 800000000000000. |
| rejected | WETH->USDC | UniswapV3 | uniswap-v3-usdc-weth-5bps | No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 800000000000000. |
| considered | WETH->FAME | Solidly | scale-equalizer-weth-fame | Edge appears in at least one generated executable candidate. |
| selected | WETH->FAME | UniswapV2 | uniswap-v2-fame-direct | Edge is part of the selected ready route. |
| considered | 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME | Solidly | scale-equalizer-scale-fame | Edge appears in at least one generated executable candidate. |
| disabled | USDC->WETH | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | USDC->WETH | Solidly | missing | No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe. |
| considered | USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c | Solidly | scale-equalizer-usdc-scale | Edge appears in at least one generated executable candidate. |
| rejected | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Slipstream | slipstream-usdc-frxusd | No recorded quote evidence for slipstream-usdc-frxusd at input 1700808. |
| rejected | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Solidly | scale-equalizer-usdc-frxusd | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 1700808. |
| rejected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME | Solidly | scale-equalizer-frxusd-fame | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 1700808. |

### Protocol Coverage

| Edge | Status | Quote | Pre | Post | Impact | Active Liquidity | Simulation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 uniswap-v4-basedflick-zora | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME slipstream-basedflick-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->0x1111111111166b7fe7bd91427724b487980afc69 slipstream-zora-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->0x1111111111166b7fe7bd91427724b487980afc69 uniswap-v3-zora-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC aerodrome-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-100 | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 800000000000000.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 800000000000000.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 800000000000000.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 800000000000000.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 800000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| WETH->USDC missing | missing/missing_edge | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| WETH->USDC uniswap-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC uniswap-v3-usdc-weth-30bps | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 800000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 800000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 800000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 800000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 800000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC uniswap-v3-usdc-weth-5bps | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 800000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 800000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 800000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 800000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 800000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->FAME scale-equalizer-weth-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->FAME uniswap-v2-fame-direct | selected/selected_leg | available 7179620009320270069468 | available 9002218386072750940623288 | available 9000838795274638664607500 | available 30 | not_applicable (Constant-product reserve replay uses reserves, not V4 active liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |
| 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME scale-equalizer-scale-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| USDC->WETH missing | missing/missing_edge | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c scale-equalizer-usdc-scale | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 slipstream-usdc-frxusd | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 1700808.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 1700808.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 1700808.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 1700808.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 1700808.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 scale-equalizer-usdc-frxusd | rejected/candidate_rejection | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 1700808.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 1700808.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 1700808.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 1700808.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 1700808.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME scale-equalizer-frxusd-fame | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 1700808.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 1700808.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 1700808.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 1700808.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 1700808.) | not_applicable (Only the selected ready route is route-simulated.) |

### Suggested Contract Todo

# Prove WETH->FAME Route For 800000000000000

## Evidence
- www route-lab case: weth-fame-split
- Pair: WETH->FAME
- Amount in: 800000000000000
- Selected pools: uniswap-v2-fame-direct
- Quote context: indexed:8453:46312158:fresh 7, stale 0, unknown 1, unsupported 8
- Router fee amount: 15953115660709640094

## Acceptance Criteria
- [ ] Add or update contract-repo fork evidence for this exact amount and pool set.
- [ ] Capture selected-pool capacity or route artifact metadata if the route should become launch evidence.

## weth-fame-large-closed

- Mode: indexed
- Pair: WETH->FAME
- Amount in: 2000000000000000
- Status: ready
- Expected: ready
- Selected pools: uniswap-v2-fame-direct
- Quote context: indexed:8453:46312158:fresh 7, stale 0, unknown 1, unsupported 8
- Router fee amount: 39878212356685354981
- Venue fees included in quotes: true
- Computable price-impact legs: 1
- Max leg market impact bps: 31
- Rejections: 13
- Candidate generation diagnostics: 0
- Optimizer: selected, allocation 0, algorithm grid, stop grid_complete, trials 14, cache hits 6
- Indexed pool state: fresh 7, stale 0, unknown 1, unsupported 8, max freshness 120
- Edge matrix: selected 1, considered 9, rejected 6, disabled 2, missing 2
- Protocol coverage: selected 1, considered 9, rejected 6, disabled 2, missing 2
- Simulation: Indexed route lab does not run live route simulation.

### Optimizer

- Status: selected
- Selected template: direct-split-scale-equalizer-weth-fame--uniswap-v2-fame-direct
- Selected allocation bps: 0
- Selected allocation vector: n/a
- Selected algorithm: grid
- Selected stop reason: grid_complete
- Selected candidate: optimizer-direct-split-scale-equalizer-weth-fame--uniswap-v2-fame-direct-10000bps
- Fallback reason: n/a
- Trial statuses: selected 2, rejected 11, pruned 0, budget_exhausted 0, quote_failed 0, unsupported_shape 0, ineligible 1
- Quote plan stats: logical 56, unique exact 43, exact cache hits 6, unique state 0, state cache hits 0, rpc 0

| Allocation | Algorithm | Stop | Status | Pools | Protected | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| n/a | local_math | unsupported_protocol | ineligible | scale-equalizer-weth-fame, uniswap-v2-fame-direct | n/a | Local marginal-price allocation requires an explicit adapter capability with complete pinned-block state. |
| 0 | grid | grid_complete | selected | uniswap-v2-fame-direct | 17728040926705901044867 | Selected by protected-output objective. |
| 500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17721129404077729837568 | Quoted successfully but did not win the optimizer objective. |
| 1000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17714180167795924586686 | Quoted successfully but did not win the optimizer objective. |
| 2000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17700168555267675908249 | Quoted successfully but did not win the optimizer objective. |
| 3500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17678868290298297366587 | Quoted successfully but did not win the optimizer objective. |
| 5000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17657228615888976374658 | Quoted successfully but did not win the optimizer objective. |
| 6500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17635249538754775766552 | Quoted successfully but did not win the optimizer objective. |
| 8000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17612931065606439330073 | Quoted successfully but did not win the optimizer objective. |
| 9000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17597863533478354345755 | Quoted successfully but did not win the optimizer objective. |
| 9500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17590273203150392088278 | Quoted successfully but did not win the optimizer objective. |
| 10000 | grid | grid_complete | selected | scale-equalizer-weth-fame | 17582645163644064897605 | Selected by protected-output objective. |

### Edge Matrix

| Status | Edge | Venue | Pool | Reason |
| --- | --- | --- | --- | --- |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 | UniswapV4 | uniswap-v4-basedflick-zora | Edge appears in at least one generated executable candidate. |
| considered | 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME | Slipstream | slipstream-basedflick-fame | Edge appears in at least one generated executable candidate. |
| considered | WETH->0x1111111111166b7fe7bd91427724b487980afc69 | Slipstream | slipstream-zora-weth | Edge appears in at least one generated executable candidate. |
| considered | WETH->0x1111111111166b7fe7bd91427724b487980afc69 | UniswapV3 | uniswap-v3-zora-weth | Edge appears in at least one generated executable candidate. |
| considered | WETH->USDC | AerodromeV2 | aerodrome-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| rejected | WETH->USDC | Slipstream | slipstream-usdc-weth-100 | No recorded quote evidence for slipstream-usdc-weth-100 at input 2000000000000000. |
| disabled | WETH->USDC | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | WETH->USDC | Solidly | missing | No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe. |
| considered | WETH->USDC | UniswapV2 | uniswap-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| rejected | WETH->USDC | UniswapV3 | uniswap-v3-usdc-weth-30bps | No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 2000000000000000. |
| rejected | WETH->USDC | UniswapV3 | uniswap-v3-usdc-weth-5bps | No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 2000000000000000. |
| considered | WETH->FAME | Solidly | scale-equalizer-weth-fame | Edge appears in at least one generated executable candidate. |
| selected | WETH->FAME | UniswapV2 | uniswap-v2-fame-direct | Edge is part of the selected ready route. |
| considered | 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME | Solidly | scale-equalizer-scale-fame | Edge appears in at least one generated executable candidate. |
| disabled | USDC->WETH | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | USDC->WETH | Solidly | missing | No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe. |
| considered | USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c | Solidly | scale-equalizer-usdc-scale | Edge appears in at least one generated executable candidate. |
| rejected | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Slipstream | slipstream-usdc-frxusd | No recorded quote evidence for slipstream-usdc-frxusd at input 4252019. |
| rejected | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Solidly | scale-equalizer-usdc-frxusd | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 4252019. |
| rejected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME | Solidly | scale-equalizer-frxusd-fame | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 4252019. |

### Protocol Coverage

| Edge | Status | Quote | Pre | Post | Impact | Active Liquidity | Simulation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 uniswap-v4-basedflick-zora | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME slipstream-basedflick-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->0x1111111111166b7fe7bd91427724b487980afc69 slipstream-zora-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->0x1111111111166b7fe7bd91427724b487980afc69 uniswap-v3-zora-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC aerodrome-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-100 | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 2000000000000000.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 2000000000000000.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 2000000000000000.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 2000000000000000.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 2000000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| WETH->USDC missing | missing/missing_edge | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| WETH->USDC uniswap-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC uniswap-v3-usdc-weth-30bps | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 2000000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC uniswap-v3-usdc-weth-5bps | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 2000000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->FAME scale-equalizer-weth-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->FAME uniswap-v2-fame-direct | selected/selected_leg | available 17946990259534363178079 | available 9002218386072750940623288 | available 8998770003627535358712340 | available 31 | not_applicable (Constant-product reserve replay uses reserves, not V4 active liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |
| 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME scale-equalizer-scale-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| USDC->WETH missing | missing/missing_edge | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c scale-equalizer-usdc-scale | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 slipstream-usdc-frxusd | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 4252019.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 4252019.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 4252019.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 4252019.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 4252019.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 scale-equalizer-usdc-frxusd | rejected/candidate_rejection | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 4252019.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 4252019.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 4252019.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 4252019.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 4252019.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME scale-equalizer-frxusd-fame | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 4252019.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 4252019.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 4252019.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 4252019.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 4252019.) | not_applicable (Only the selected ready route is route-simulated.) |

### Suggested Contract Todo

# Prove WETH->FAME Route For 2000000000000000

## Evidence
- www route-lab case: weth-fame-large-closed
- Pair: WETH->FAME
- Amount in: 2000000000000000
- Selected pools: uniswap-v2-fame-direct
- Quote context: indexed:8453:46312158:fresh 7, stale 0, unknown 1, unsupported 8
- Router fee amount: 39878212356685354981

## Acceptance Criteria
- [ ] Add or update contract-repo fork evidence for this exact amount and pool set.
- [ ] Capture selected-pool capacity or route artifact metadata if the route should become launch evidence.

## fame-weth-fixture

- Mode: indexed
- Pair: FAME->WETH
- Amount in: 31597600141347829
- Status: ready
- Expected: ready
- Selected pools: uniswap-v2-fame-direct
- Quote context: indexed:8453:46312158:fresh 7, stale 0, unknown 1, unsupported 8
- Router fee amount: 7775776
- Venue fees included in quotes: true
- Computable price-impact legs: 1
- Max leg market impact bps: 30
- Rejections: 13
- Candidate generation diagnostics: 0
- Optimizer: selected, allocation 0, algorithm grid, stop grid_complete, trials 14, cache hits 13
- Indexed pool state: fresh 7, stale 0, unknown 1, unsupported 8, max freshness 120
- Edge matrix: selected 1, considered 9, rejected 6, disabled 2, missing 2
- Protocol coverage: selected 1, considered 9, rejected 6, disabled 2, missing 2
- Simulation: Indexed route lab does not run live route simulation.

### Optimizer

- Status: selected
- Selected template: direct-split-scale-equalizer-weth-fame--uniswap-v2-fame-direct
- Selected allocation bps: 0
- Selected allocation vector: n/a
- Selected algorithm: grid
- Selected stop reason: grid_complete
- Selected candidate: optimizer-direct-split-scale-equalizer-weth-fame--uniswap-v2-fame-direct-10000bps
- Fallback reason: n/a
- Trial statuses: selected 2, rejected 11, pruned 0, budget_exhausted 0, quote_failed 0, unsupported_shape 0, ineligible 1
- Quote plan stats: logical 68, unique exact 38, exact cache hits 13, unique state 0, state cache hits 0, rpc 0

| Allocation | Algorithm | Stop | Status | Pools | Protected | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| n/a | local_math | unsupported_protocol | ineligible | scale-equalizer-weth-fame, uniswap-v2-fame-direct | n/a | Local marginal-price allocation requires an explicit adapter capability with complete pinned-block state. |
| 0 | grid | grid_complete | selected | uniswap-v2-fame-direct | 3456756843 | Selected by protected-output objective. |
| 500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 3455739895 | Quoted successfully but did not win the optimizer objective. |
| 1000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 3454722947 | Quoted successfully but did not win the optimizer objective. |
| 2000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 3452689052 | Quoted successfully but did not win the optimizer objective. |
| 3500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 3449638210 | Quoted successfully but did not win the optimizer objective. |
| 5000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 3446587368 | Quoted successfully but did not win the optimizer objective. |
| 6500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 3443536523 | Quoted successfully but did not win the optimizer objective. |
| 8000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 3440485681 | Quoted successfully but did not win the optimizer objective. |
| 9000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 3438451785 | Quoted successfully but did not win the optimizer objective. |
| 9500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct | 3437434837 | Quoted successfully but did not win the optimizer objective. |
| 10000 | grid | grid_complete | selected | scale-equalizer-weth-fame | 3436417891 | Selected by protected-output objective. |

### Edge Matrix

| Status | Edge | Venue | Pool | Reason |
| --- | --- | --- | --- | --- |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->WETH | Slipstream | slipstream-zora-weth | Edge appears in at least one generated executable candidate. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->WETH | UniswapV3 | uniswap-v3-zora-weth | Edge appears in at least one generated executable candidate. |
| considered | 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->0x1111111111166b7fe7bd91427724b487980afc69 | UniswapV4 | uniswap-v4-basedflick-zora | Edge appears in at least one generated executable candidate. |
| disabled | WETH->USDC | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | WETH->USDC | Solidly | missing | No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe. |
| considered | 0x54016a4848a38f257b6e96331f7404073fd9c32c->USDC | Solidly | scale-equalizer-usdc-scale | Edge appears in at least one generated executable candidate. |
| considered | USDC->WETH | AerodromeV2 | aerodrome-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| rejected | USDC->WETH | Slipstream | slipstream-usdc-weth-100 | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238. |
| disabled | USDC->WETH | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | USDC->WETH | Solidly | missing | No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe. |
| considered | USDC->WETH | UniswapV2 | uniswap-v2-usdc-weth | Edge appears in at least one generated executable candidate. |
| rejected | USDC->WETH | UniswapV3 | uniswap-v3-usdc-weth-30bps | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238. |
| rejected | USDC->WETH | UniswapV3 | uniswap-v3-usdc-weth-5bps | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238. |
| rejected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC | Slipstream | slipstream-usdc-frxusd | No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238. |
| rejected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC | Solidly | scale-equalizer-usdc-frxusd | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238. |
| considered | FAME->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 | Slipstream | slipstream-basedflick-fame | Edge appears in at least one generated executable candidate. |
| considered | FAME->WETH | Solidly | scale-equalizer-weth-fame | Edge appears in at least one generated executable candidate. |
| selected | FAME->WETH | UniswapV2 | uniswap-v2-fame-direct | Edge is part of the selected ready route. |
| considered | FAME->0x54016a4848a38f257b6e96331f7404073fd9c32c | Solidly | scale-equalizer-scale-fame | Edge appears in at least one generated executable candidate. |
| rejected | FAME->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Solidly | scale-equalizer-frxusd-fame | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238. |

### Protocol Coverage

| Edge | Status | Quote | Pre | Post | Impact | Active Liquidity | Simulation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0x1111111111166b7fe7bd91427724b487980afc69->WETH slipstream-zora-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->WETH uniswap-v3-zora-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->0x1111111111166b7fe7bd91427724b487980afc69 uniswap-v4-basedflick-zora | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| WETH->USDC missing | missing/missing_edge | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| 0x54016a4848a38f257b6e96331f7404073fd9c32c->USDC scale-equalizer-usdc-scale | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH aerodrome-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-100 | rejected/candidate_rejection | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| USDC->WETH missing | missing/missing_edge | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| USDC->WETH uniswap-v2-usdc-weth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH uniswap-v3-usdc-weth-30bps | rejected/candidate_rejection | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH uniswap-v3-usdc-weth-5bps | rejected/candidate_rejection | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC slipstream-usdc-frxusd | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC scale-equalizer-usdc-frxusd | rejected/candidate_rejection | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 slipstream-basedflick-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->WETH scale-equalizer-weth-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->WETH uniswap-v2-fame-direct | selected/selected_leg | available 3499449355 | available 111083730377 | available 111083730303 | available 30 | not_applicable (Constant-product reserve replay uses reserves, not V4 active liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |
| FAME->0x54016a4848a38f257b6e96331f7404073fd9c32c scale-equalizer-scale-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->0xe5020a6d073a794b6e7f05678707de47986fb0b6 scale-equalizer-frxusd-fame | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | not_applicable (Only the selected ready route is route-simulated.) |

### Suggested Contract Todo

# Prove FAME->WETH Route For 31597600141347829

## Evidence
- www route-lab case: fame-weth-fixture
- Pair: FAME->WETH
- Amount in: 31597600141347829
- Selected pools: uniswap-v2-fame-direct
- Quote context: indexed:8453:46312158:fresh 7, stale 0, unknown 1, unsupported 8
- Router fee amount: 7775776

## Acceptance Criteria
- [ ] Add or update contract-repo fork evidence for this exact amount and pool set.
- [ ] Capture selected-pool capacity or route artifact metadata if the route should become launch evidence.

## eth-fame-fixture

- Mode: indexed
- Pair: ETH->FAME
- Amount in: 500000000000000
- Status: ready
- Expected: ready
- Selected pools: native-wrap-weth, uniswap-v2-fame-direct
- Quote context: n/a
- Router fee amount: 9970983378674908040
- Venue fees included in quotes: true
- Computable price-impact legs: 1
- Max leg market impact bps: 30
- Rejections: 17
- Candidate generation diagnostics: 0
- Optimizer: selected, allocation 0, algorithm grid, stop grid_complete, trials 14, cache hits 29
- Indexed pool state: fresh 7, stale 0, unknown 1, unsupported 11, max freshness 120
- Edge matrix: selected 2, considered 4, rejected 13, disabled 2, missing 2
- Protocol coverage: selected 2, considered 4, rejected 13, disabled 2, missing 2
- Simulation: Indexed route lab does not run live route simulation.

### Optimizer

- Status: selected
- Selected template: terminal-split-native-wrap-weth--scale-equalizer-weth-fame--uniswap-v2-fame-direct
- Selected allocation bps: 0
- Selected allocation vector: n/a
- Selected algorithm: grid
- Selected stop reason: grid_complete
- Selected candidate: optimizer-terminal-split-native-wrap-weth--scale-equalizer-weth-fame--uniswap-v2-fame-direct-10000bps
- Fallback reason: n/a
- Trial statuses: selected 2, rejected 11, pruned 0, budget_exhausted 0, quote_failed 0, unsupported_shape 0, ineligible 1
- Quote plan stats: logical 67, unique exact 31, exact cache hits 29, unique state 0, state cache hits 0, rpc 0

| Allocation | Algorithm | Stop | Status | Pools | Protected | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| n/a | local_math | unsupported_protocol | ineligible | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | n/a | Local marginal-price allocation requires an explicit adapter capability with complete pinned-block state. |
| 0 | grid | grid_complete | selected | native-wrap-weth, uniswap-v2-fame-direct | 4432646073389476809641 | Selected by protected-output objective. |
| 500 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4430858151602695171033 | Quoted successfully but did not win the optimizer objective. |
| 1000 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4429067872244859184666 | Quoted successfully but did not win the optimizer objective. |
| 2000 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4425480240831577722465 | Quoted successfully but did not win the optimizer objective. |
| 3500 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4420081112025952162314 | Quoted successfully but did not win the optimizer objective. |
| 5000 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4414660765290783880359 | Quoted successfully but did not win the optimizer objective. |
| 6500 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4409219200731021387847 | Quoted successfully but did not win the optimizer objective. |
| 8000 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4403756418451596317778 | Quoted successfully but did not win the optimizer objective. |
| 9000 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4400102776028421955881 | Quoted successfully but did not win the optimizer objective. |
| 9500 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 4398272418557423425175 | Quoted successfully but did not win the optimizer objective. |
| 10000 | grid | grid_complete | selected | native-wrap-weth, scale-equalizer-weth-fame | 4396439703585330595022 | Selected by protected-output objective. |

### Edge Matrix

| Status | Edge | Venue | Pool | Reason |
| --- | --- | --- | --- | --- |
| considered | ETH->0x1111111111166b7fe7bd91427724b487980afc69 | UniswapV4 | uniswap-v4-zora-eth | Edge appears in at least one generated executable candidate. |
| selected | ETH->WETH | NativeWrap | native-wrap-weth | Edge is part of the selected ready route. |
| rejected | ETH->USDC | UniswapV4 | uniswap-v4-usdc-eth | No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 | UniswapV4 | uniswap-v4-basedflick-zora | Edge appears in at least one generated executable candidate. |
| rejected | 0x1111111111166b7fe7bd91427724b487980afc69->WETH | Slipstream | slipstream-zora-weth | No recorded quote evidence for slipstream-zora-weth at input 90138418366337405067. |
| rejected | 0x1111111111166b7fe7bd91427724b487980afc69->WETH | UniswapV3 | uniswap-v3-zora-weth | No recorded quote evidence for uniswap-v3-zora-weth at input 90138418366337405067. |
| considered | 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME | Slipstream | slipstream-basedflick-fame | Edge appears in at least one generated executable candidate. |
| disabled | WETH->USDC | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | WETH->USDC | Solidly | missing | No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe. |
| considered | WETH->FAME | Solidly | scale-equalizer-weth-fame | Edge appears in at least one generated executable candidate. |
| selected | WETH->FAME | UniswapV2 | uniswap-v2-fame-direct | Edge is part of the selected ready route. |
| rejected | 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME | Solidly | scale-equalizer-scale-fame | No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000. |
| rejected | USDC->WETH | AerodromeV2 | aerodrome-v2-usdc-weth | No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000. |
| rejected | USDC->WETH | Slipstream | slipstream-usdc-weth-100 | No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000. |
| disabled | USDC->WETH | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | USDC->WETH | Solidly | missing | No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe. |
| rejected | USDC->WETH | UniswapV2 | uniswap-v2-usdc-weth | No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000. |
| rejected | USDC->WETH | UniswapV3 | uniswap-v3-usdc-weth-30bps | No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000. |
| rejected | USDC->WETH | UniswapV3 | uniswap-v3-usdc-weth-5bps | No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000. |
| rejected | USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c | Solidly | scale-equalizer-usdc-scale | No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000. |
| rejected | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Slipstream | slipstream-usdc-frxusd | No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000. |
| rejected | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Solidly | scale-equalizer-usdc-frxusd | No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000. |
| rejected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME | Solidly | scale-equalizer-frxusd-fame | No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000. |

### Protocol Coverage

| Edge | Status | Quote | Pre | Post | Impact | Active Liquidity | Simulation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ETH->0x1111111111166b7fe7bd91427724b487980afc69 uniswap-v4-zora-eth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| ETH->WETH native-wrap-weth | selected/selected_leg | available 500000000000000 | not_applicable (Native wrap is a 1:1 [redacted-secret], not a priced pool swap.) | not_applicable (Native wrap is a 1:1 [redacted-secret], not a priced pool swap.) | not_applicable (Native wrap has no market impact.) | not_applicable (Native wrap uses canonical WETH deposit/withdraw, not pool liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |
| ETH->USDC uniswap-v4-usdc-eth | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 uniswap-v4-basedflick-zora | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->WETH slipstream-zora-weth | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-zora-weth at input 90138418366337405067.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 90138418366337405067.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 90138418366337405067.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 90138418366337405067.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 90138418366337405067.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->WETH uniswap-v3-zora-weth | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 90138418366337405067.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 90138418366337405067.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 90138418366337405067.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 90138418366337405067.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 90138418366337405067.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME slipstream-basedflick-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| WETH->USDC missing | missing/missing_edge | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| WETH->FAME scale-equalizer-weth-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->FAME uniswap-v2-fame-direct | selected/selected_leg | available 4487391259529661584446 | available 9002218386072750940623288 | available 9001356104657432789142224 | available 30 | not_applicable (Constant-product reserve replay uses reserves, not V4 active liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |
| 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME scale-equalizer-scale-fame | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH aerodrome-v2-usdc-weth | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-100 | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| USDC->WETH missing | missing/missing_edge | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| USDC->WETH uniswap-v2-usdc-weth | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH uniswap-v3-usdc-weth-30bps | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH uniswap-v3-usdc-weth-5bps | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c scale-equalizer-usdc-scale | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 slipstream-usdc-frxusd | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 scale-equalizer-usdc-frxusd | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME scale-equalizer-frxusd-fame | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 500000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |

### Suggested Contract Todo

# Prove ETH->FAME Route For 500000000000000

## Evidence
- www route-lab case: eth-fame-fixture
- Pair: ETH->FAME
- Amount in: 500000000000000
- Selected pools: native-wrap-weth, uniswap-v2-fame-direct
- Quote context: unavailable
- Router fee amount: 9970983378674908040

## Acceptance Criteria
- [ ] Add or update contract-repo fork evidence for this exact amount and pool set.
- [ ] Capture selected-pool capacity or route artifact metadata if the route should become launch evidence.

## eth-fame-large-closed

- Mode: indexed
- Pair: ETH->FAME
- Amount in: 2000000000000000
- Status: ready
- Expected: ready
- Selected pools: native-wrap-weth, uniswap-v2-fame-direct
- Quote context: n/a
- Router fee amount: 39878212356685354981
- Venue fees included in quotes: true
- Computable price-impact legs: 1
- Max leg market impact bps: 31
- Rejections: 17
- Candidate generation diagnostics: 0
- Optimizer: selected, allocation 0, algorithm grid, stop grid_complete, trials 14, cache hits 29
- Indexed pool state: fresh 7, stale 0, unknown 1, unsupported 11, max freshness 120
- Edge matrix: selected 2, considered 4, rejected 13, disabled 2, missing 2
- Protocol coverage: selected 2, considered 4, rejected 13, disabled 2, missing 2
- Simulation: Indexed route lab does not run live route simulation.

### Optimizer

- Status: selected
- Selected template: terminal-split-native-wrap-weth--scale-equalizer-weth-fame--uniswap-v2-fame-direct
- Selected allocation bps: 0
- Selected allocation vector: n/a
- Selected algorithm: grid
- Selected stop reason: grid_complete
- Selected candidate: optimizer-terminal-split-native-wrap-weth--scale-equalizer-weth-fame--uniswap-v2-fame-direct-10000bps
- Fallback reason: n/a
- Trial statuses: selected 2, rejected 11, pruned 0, budget_exhausted 0, quote_failed 0, unsupported_shape 0, ineligible 1
- Quote plan stats: logical 67, unique exact 31, exact cache hits 29, unique state 0, state cache hits 0, rpc 0

| Allocation | Algorithm | Stop | Status | Pools | Protected | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| n/a | local_math | unsupported_protocol | ineligible | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | n/a | Local marginal-price allocation requires an explicit adapter capability with complete pinned-block state. |
| 0 | grid | grid_complete | selected | native-wrap-weth, uniswap-v2-fame-direct | 17728040926705901044867 | Selected by protected-output objective. |
| 500 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17721129404077729837568 | Quoted successfully but did not win the optimizer objective. |
| 1000 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17714180167795924586686 | Quoted successfully but did not win the optimizer objective. |
| 2000 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17700168555267675908249 | Quoted successfully but did not win the optimizer objective. |
| 3500 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17678868290298297366587 | Quoted successfully but did not win the optimizer objective. |
| 5000 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17657228615888976374658 | Quoted successfully but did not win the optimizer objective. |
| 6500 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17635249538754775766552 | Quoted successfully but did not win the optimizer objective. |
| 8000 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17612931065606439330073 | Quoted successfully but did not win the optimizer objective. |
| 9000 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17597863533478354345755 | Quoted successfully but did not win the optimizer objective. |
| 9500 | grid | grid_complete | rejected | native-wrap-weth, scale-equalizer-weth-fame, uniswap-v2-fame-direct | 17590273203150392088278 | Quoted successfully but did not win the optimizer objective. |
| 10000 | grid | grid_complete | selected | native-wrap-weth, scale-equalizer-weth-fame | 17582645163644064897605 | Selected by protected-output objective. |

### Edge Matrix

| Status | Edge | Venue | Pool | Reason |
| --- | --- | --- | --- | --- |
| considered | ETH->0x1111111111166b7fe7bd91427724b487980afc69 | UniswapV4 | uniswap-v4-zora-eth | Edge appears in at least one generated executable candidate. |
| selected | ETH->WETH | NativeWrap | native-wrap-weth | Edge is part of the selected ready route. |
| rejected | ETH->USDC | UniswapV4 | uniswap-v4-usdc-eth | No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000. |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 | UniswapV4 | uniswap-v4-basedflick-zora | Edge appears in at least one generated executable candidate. |
| rejected | 0x1111111111166b7fe7bd91427724b487980afc69->WETH | Slipstream | slipstream-zora-weth | No recorded quote evidence for slipstream-zora-weth at input 360348593853444020159. |
| rejected | 0x1111111111166b7fe7bd91427724b487980afc69->WETH | UniswapV3 | uniswap-v3-zora-weth | No recorded quote evidence for uniswap-v3-zora-weth at input 360348593853444020159. |
| considered | 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME | Slipstream | slipstream-basedflick-fame | Edge appears in at least one generated executable candidate. |
| disabled | WETH->USDC | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | WETH->USDC | Solidly | missing | No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe. |
| considered | WETH->FAME | Solidly | scale-equalizer-weth-fame | Edge appears in at least one generated executable candidate. |
| selected | WETH->FAME | UniswapV2 | uniswap-v2-fame-direct | Edge is part of the selected ready route. |
| rejected | 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME | Solidly | scale-equalizer-scale-fame | No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000. |
| rejected | USDC->WETH | AerodromeV2 | aerodrome-v2-usdc-weth | No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000. |
| rejected | USDC->WETH | Slipstream | slipstream-usdc-weth-100 | No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000. |
| disabled | USDC->WETH | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | USDC->WETH | Solidly | missing | No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe. |
| rejected | USDC->WETH | UniswapV2 | uniswap-v2-usdc-weth | No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000. |
| rejected | USDC->WETH | UniswapV3 | uniswap-v3-usdc-weth-30bps | No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000. |
| rejected | USDC->WETH | UniswapV3 | uniswap-v3-usdc-weth-5bps | No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000. |
| rejected | USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c | Solidly | scale-equalizer-usdc-scale | No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000. |
| rejected | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Slipstream | slipstream-usdc-frxusd | No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000. |
| rejected | USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Solidly | scale-equalizer-usdc-frxusd | No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000. |
| rejected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME | Solidly | scale-equalizer-frxusd-fame | No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000. |

### Protocol Coverage

| Edge | Status | Quote | Pre | Post | Impact | Active Liquidity | Simulation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ETH->0x1111111111166b7fe7bd91427724b487980afc69 uniswap-v4-zora-eth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| ETH->WETH native-wrap-weth | selected/selected_leg | available 2000000000000000 | not_applicable (Native wrap is a 1:1 [redacted-secret], not a priced pool swap.) | not_applicable (Native wrap is a 1:1 [redacted-secret], not a priced pool swap.) | not_applicable (Native wrap has no market impact.) | not_applicable (Native wrap uses canonical WETH deposit/withdraw, not pool liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |
| ETH->USDC uniswap-v4-usdc-eth | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 uniswap-v4-basedflick-zora | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->WETH slipstream-zora-weth | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-zora-weth at input 360348593853444020159.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 360348593853444020159.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 360348593853444020159.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 360348593853444020159.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 360348593853444020159.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x1111111111166b7fe7bd91427724b487980afc69->WETH uniswap-v3-zora-weth | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 360348593853444020159.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 360348593853444020159.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 360348593853444020159.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 360348593853444020159.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 360348593853444020159.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->FAME slipstream-basedflick-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| WETH->USDC missing | missing/missing_edge | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| WETH->FAME scale-equalizer-weth-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->FAME uniswap-v2-fame-direct | selected/selected_leg | available 17946990259534363178079 | available 9002218386072750940623288 | available 8998770003627535358712340 | available 31 | not_applicable (Constant-product reserve replay uses reserves, not V4 active liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |
| 0x54016a4848a38f257b6e96331f7404073fd9c32c->FAME scale-equalizer-scale-fame | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH aerodrome-v2-usdc-weth | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-100 | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| USDC->WETH missing | missing/missing_edge | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| USDC->WETH uniswap-v2-usdc-weth | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH uniswap-v3-usdc-weth-30bps | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH uniswap-v3-usdc-weth-5bps | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0x54016a4848a38f257b6e96331f7404073fd9c32c scale-equalizer-usdc-scale | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 slipstream-usdc-frxusd | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->0xe5020a6d073a794b6e7f05678707de47986fb0b6 scale-equalizer-usdc-frxusd | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->FAME scale-equalizer-frxusd-fame | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 2000000000000000.) | not_applicable (Only the selected ready route is route-simulated.) |

### Suggested Contract Todo

# Prove ETH->FAME Route For 2000000000000000

## Evidence
- www route-lab case: eth-fame-large-closed
- Pair: ETH->FAME
- Amount in: 2000000000000000
- Selected pools: native-wrap-weth, uniswap-v2-fame-direct
- Quote context: unavailable
- Router fee amount: 39878212356685354981

## Acceptance Criteria
- [ ] Add or update contract-repo fork evidence for this exact amount and pool set.
- [ ] Capture selected-pool capacity or route artifact metadata if the route should become launch evidence.

## fame-eth-fixture

- Mode: indexed
- Pair: FAME->ETH
- Amount in: 31597600141347829
- Status: ready
- Expected: ready
- Selected pools: uniswap-v2-fame-direct, native-wrap-weth
- Quote context: n/a
- Router fee amount: 7775776
- Venue fees included in quotes: true
- Computable price-impact legs: 1
- Max leg market impact bps: 30
- Rejections: 17
- Candidate generation diagnostics: 0
- Optimizer: selected, allocation 0, algorithm grid, stop grid_complete, trials 14, cache hits 22
- Indexed pool state: fresh 7, stale 0, unknown 1, unsupported 11, max freshness 120
- Edge matrix: selected 2, considered 4, rejected 13, disabled 2, missing 2
- Protocol coverage: selected 2, considered 4, rejected 13, disabled 2, missing 2
- Simulation: Indexed route lab does not run live route simulation.

### Optimizer

- Status: selected
- Selected template: split-merge-scale-equalizer-weth-fame--uniswap-v2-fame-direct--native-wrap-weth
- Selected allocation bps: 0
- Selected allocation vector: n/a
- Selected algorithm: grid
- Selected stop reason: grid_complete
- Selected candidate: optimizer-split-merge-scale-equalizer-weth-fame--uniswap-v2-fame-direct--native-wrap-weth-10000bps
- Fallback reason: n/a
- Trial statuses: selected 2, rejected 11, pruned 0, budget_exhausted 0, quote_failed 0, unsupported_shape 0, ineligible 1
- Quote plan stats: logical 85, unique exact 60, exact cache hits 22, unique state 0, state cache hits 0, rpc 0

| Allocation | Algorithm | Stop | Status | Pools | Protected | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| n/a | local_math | unsupported_protocol | ineligible | scale-equalizer-weth-fame, uniswap-v2-fame-direct, native-wrap-weth | n/a | Local marginal-price allocation requires an explicit adapter capability with complete pinned-block state. |
| 0 | grid | grid_complete | selected | uniswap-v2-fame-direct, native-wrap-weth | 3456756843 | Selected by protected-output objective. |
| 500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct, native-wrap-weth | 3455739895 | Quoted successfully but did not win the optimizer objective. |
| 1000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct, native-wrap-weth | 3454722947 | Quoted successfully but did not win the optimizer objective. |
| 2000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct, native-wrap-weth | 3452689052 | Quoted successfully but did not win the optimizer objective. |
| 3500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct, native-wrap-weth | 3449638210 | Quoted successfully but did not win the optimizer objective. |
| 5000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct, native-wrap-weth | 3446587368 | Quoted successfully but did not win the optimizer objective. |
| 6500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct, native-wrap-weth | 3443536523 | Quoted successfully but did not win the optimizer objective. |
| 8000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct, native-wrap-weth | 3440485681 | Quoted successfully but did not win the optimizer objective. |
| 9000 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct, native-wrap-weth | 3438451785 | Quoted successfully but did not win the optimizer objective. |
| 9500 | grid | grid_complete | rejected | scale-equalizer-weth-fame, uniswap-v2-fame-direct, native-wrap-weth | 3437434837 | Quoted successfully but did not win the optimizer objective. |
| 10000 | grid | grid_complete | selected | scale-equalizer-weth-fame, native-wrap-weth | 3436417891 | Selected by protected-output objective. |

### Edge Matrix

| Status | Edge | Venue | Pool | Reason |
| --- | --- | --- | --- | --- |
| considered | 0x1111111111166b7fe7bd91427724b487980afc69->ETH | UniswapV4 | uniswap-v4-zora-eth | Edge appears in at least one generated executable candidate. |
| considered | 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->0x1111111111166b7fe7bd91427724b487980afc69 | UniswapV4 | uniswap-v4-basedflick-zora | Edge appears in at least one generated executable candidate. |
| selected | WETH->ETH | NativeWrap | native-wrap-weth | Edge is part of the selected ready route. |
| rejected | WETH->0x1111111111166b7fe7bd91427724b487980afc69 | Slipstream | slipstream-zora-weth | No recorded quote evidence for slipstream-zora-weth at input 3478859208. |
| rejected | WETH->0x1111111111166b7fe7bd91427724b487980afc69 | UniswapV3 | uniswap-v3-zora-weth | No recorded quote evidence for uniswap-v3-zora-weth at input 3478859208. |
| rejected | WETH->USDC | AerodromeV2 | aerodrome-v2-usdc-weth | No recorded quote evidence for uniswap-v4-usdc-eth at input 7. |
| rejected | WETH->USDC | Slipstream | slipstream-usdc-weth-100 | No recorded quote evidence for slipstream-usdc-weth-100 at input 3478859208. |
| disabled | WETH->USDC | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | WETH->USDC | Solidly | missing | No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe. |
| rejected | WETH->USDC | UniswapV2 | uniswap-v2-usdc-weth | No recorded quote evidence for uniswap-v4-usdc-eth at input 7. |
| rejected | WETH->USDC | UniswapV3 | uniswap-v3-usdc-weth-30bps | No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 3478859208. |
| rejected | WETH->USDC | UniswapV3 | uniswap-v3-usdc-weth-5bps | No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 3478859208. |
| rejected | 0x54016a4848a38f257b6e96331f7404073fd9c32c->USDC | Solidly | scale-equalizer-usdc-scale | No recorded quote evidence for uniswap-v4-usdc-eth at input 7. |
| rejected | USDC->ETH | UniswapV4 | uniswap-v4-usdc-eth | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238. |
| disabled | USDC->WETH | Slipstream | slipstream-usdc-weth-migrating-50 | slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory. |
| missing | USDC->WETH | Solidly | missing | No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe. |
| rejected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC | Slipstream | slipstream-usdc-frxusd | No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238. |
| rejected | 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC | Solidly | scale-equalizer-usdc-frxusd | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238. |
| considered | FAME->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 | Slipstream | slipstream-basedflick-fame | Edge appears in at least one generated executable candidate. |
| considered | FAME->WETH | Solidly | scale-equalizer-weth-fame | Edge appears in at least one generated executable candidate. |
| selected | FAME->WETH | UniswapV2 | uniswap-v2-fame-direct | Edge is part of the selected ready route. |
| rejected | FAME->0x54016a4848a38f257b6e96331f7404073fd9c32c | Solidly | scale-equalizer-scale-fame | No recorded quote evidence for uniswap-v4-usdc-eth at input 7. |
| rejected | FAME->0xe5020a6d073a794b6e7f05678707de47986fb0b6 | Solidly | scale-equalizer-frxusd-fame | No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238. |

### Protocol Coverage

| Edge | Status | Quote | Pre | Post | Impact | Active Liquidity | Simulation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0x1111111111166b7fe7bd91427724b487980afc69->ETH uniswap-v4-zora-eth | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926->0x1111111111166b7fe7bd91427724b487980afc69 uniswap-v4-basedflick-zora | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->ETH native-wrap-weth | selected/selected_leg | available 3499449355 | not_applicable (Native wrap is a 1:1 [redacted-secret], not a priced pool swap.) | not_applicable (Native wrap is a 1:1 [redacted-secret], not a priced pool swap.) | not_applicable (Native wrap has no market impact.) | not_applicable (Native wrap uses canonical WETH deposit/withdraw, not pool liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |
| WETH->0x1111111111166b7fe7bd91427724b487980afc69 slipstream-zora-weth | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for slipstream-zora-weth at input 3478859208.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->0x1111111111166b7fe7bd91427724b487980afc69 uniswap-v3-zora-weth | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-zora-weth at input 3478859208.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC aerodrome-v2-usdc-weth | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-100 | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 3478859208.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 3478859208.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 3478859208.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 3478859208.) | unavailable (No recorded quote evidence for slipstream-usdc-weth-100 at input 3478859208.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| WETH->USDC missing | missing/missing_edge | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly WETH/USDC connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| WETH->USDC uniswap-v2-usdc-weth | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC uniswap-v3-usdc-weth-30bps | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-30bps at input 3478859208.) | not_applicable (Only the selected ready route is route-simulated.) |
| WETH->USDC uniswap-v3-usdc-weth-5bps | rejected/candidate_rejection | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 3478859208.) | unavailable (No recorded quote evidence for uniswap-v3-usdc-weth-5bps at input 3478859208.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0x54016a4848a38f257b6e96331f7404073fd9c32c->USDC scale-equalizer-usdc-scale | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->ETH uniswap-v4-usdc-eth | rejected/candidate_rejection | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | not_applicable (Only the selected ready route is route-simulated.) |
| USDC->WETH slipstream-usdc-weth-migrating-50 | disabled/disabled_edge | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (slipstream-usdc-weth-migrating-50 is disabled: Aerodrome migrating pool belongs to factory 0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef; the current FameRouter Slipstream adapter validates the 0x5e7B... factory and the current live quoter path quotes the wrong tick-spacing pool for this migrated factory.) | disabled (Disabled edges are not route-simulated.) |
| USDC->WETH missing | missing/missing_edge | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (No reviewed Solidly USDC/WETH connector pool is present in the FAME pool universe.) | unavailable (Missing edges cannot be route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC slipstream-usdc-frxusd | rejected/candidate_rejection | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for slipstream-usdc-frxusd at input 7354844102238.) | not_applicable (Only the selected ready route is route-simulated.) |
| 0xe5020a6d073a794b6e7f05678707de47986fb0b6->USDC scale-equalizer-usdc-frxusd | rejected/candidate_rejection | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926 slipstream-basedflick-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->WETH scale-equalizer-weth-fame | considered/considered_candidate | unavailable (Edge appears in generated candidates, but selected-leg quote evidence is not retained for unselected routes.) | unavailable (Pre-price evidence is not retained for unselected routes.) | unavailable (Post-price evidence is not retained for unselected routes.) | unavailable (Market-impact evidence is not retained for unselected routes.) | unavailable (Active liquidity evidence is not retained for unselected routes.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->WETH uniswap-v2-fame-direct | selected/selected_leg | available 3499449355 | available 111083730377 | available 111083730303 | available 30 | not_applicable (Constant-product reserve replay uses reserves, not V4 active liquidity.) | unavailable (Indexed route lab does not run live route simulation.) |
| FAME->0x54016a4848a38f257b6e96331f7404073fd9c32c scale-equalizer-scale-fame | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | unavailable (No recorded quote evidence for uniswap-v4-usdc-eth at input 7.) | not_applicable (Only the selected ready route is route-simulated.) |
| FAME->0xe5020a6d073a794b6e7f05678707de47986fb0b6 scale-equalizer-frxusd-fame | rejected/candidate_rejected_elsewhere | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | unavailable (No recorded quote evidence for scale-equalizer-usdc-frxusd at input 7354844102238.) | not_applicable (Only the selected ready route is route-simulated.) |

### Suggested Contract Todo

# Prove FAME->ETH Route For 31597600141347829

## Evidence
- www route-lab case: fame-eth-fixture
- Pair: FAME->ETH
- Amount in: 31597600141347829
- Selected pools: uniswap-v2-fame-direct, native-wrap-weth
- Quote context: unavailable
- Router fee amount: 7775776

## Acceptance Criteria
- [ ] Add or update contract-repo fork evidence for this exact amount and pool set.
- [ ] Capture selected-pool capacity or route artifact metadata if the route should become launch evidence.

