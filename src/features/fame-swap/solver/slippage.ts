export const FAME_SWAP_BPS_DENOMINATOR = 10_000;
export const DEFAULT_FAME_SWAP_SLIPPAGE_BPS = 100;

export function normalizeSlippageBps(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_FAME_SWAP_SLIPPAGE_BPS;
  const integer = Math.trunc(value);
  if (integer < 0) return 0;
  if (integer >= FAME_SWAP_BPS_DENOMINATOR) {
    return FAME_SWAP_BPS_DENOMINATOR - 1;
  }
  return integer;
}

export function applySlippageToAmount(
  amount: bigint,
  slippageBps: number,
): bigint {
  if (amount <= 1n) return amount;

  const normalized = BigInt(normalizeSlippageBps(slippageBps));
  const minimum =
    (amount * BigInt(FAME_SWAP_BPS_DENOMINATOR - Number(normalized))) /
    BigInt(FAME_SWAP_BPS_DENOMINATOR);

  return minimum > 0n ? minimum : 1n;
}
