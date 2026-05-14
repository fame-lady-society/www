import { formatUnits } from "viem";
import type { FameSwapToken } from "../tokens";

export function formatTokenAmount(
  amount: bigint,
  token: FameSwapToken,
): string {
  const formatted = formatUnits(amount, token.decimals);
  const [wholePart, fractionPart] = formatted.split(".");
  if (!fractionPart) return `${wholePart} ${token.symbol}`;

  const trimmedFraction = fractionPart.replace(/0+$/, "").slice(0, 6);
  return trimmedFraction.length > 0
    ? `${wholePart}.${trimmedFraction} ${token.symbol}`
    : `${wholePart} ${token.symbol}`;
}
