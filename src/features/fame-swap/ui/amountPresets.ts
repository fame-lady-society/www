import { formatUnits } from "viem";
import type { FameSwapToken } from "../tokens";

export const NATIVE_ETH_PRESET_RESERVE = 500_000_000_000_000n;
export const FAME_SWAP_PERCENT_PRESETS = [25, 50, 75, 100] as const;

export type FameSwapPercentPreset = (typeof FAME_SWAP_PERCENT_PRESETS)[number];

export function usablePresetBalance(
  balance: bigint,
  token: FameSwapToken,
): bigint {
  if (balance <= 0n) return 0n;
  if (!token.native) return balance;

  return balance > NATIVE_ETH_PRESET_RESERVE
    ? balance - NATIVE_ETH_PRESET_RESERVE
    : 0n;
}

export function presetAmount(
  balance: bigint,
  token: FameSwapToken,
  percent: FameSwapPercentPreset,
): bigint {
  const usable = usablePresetBalance(balance, token);
  return (usable * BigInt(percent)) / 100n;
}

export function amountToInputValue(amount: bigint, token: FameSwapToken): string {
  const formatted = formatUnits(amount, token.decimals);
  const [whole, fraction] = formatted.split(".");
  if (!fraction) return whole;

  const trimmed = fraction.replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}
