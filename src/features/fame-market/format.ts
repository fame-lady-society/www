import { formatUnits } from "viem";

const FAME_UNIT = 10n ** 18n;

export function formatTestAmount(amount: bigint) {
  const [whole, fraction = ""] = formatUnits(amount, 18).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmedFraction = fraction.replace(/0+$/, "");
  return trimmedFraction ? `${grouped}.${trimmedFraction}` : grouped;
}

export function formatTestAmountRoundedToUnit(amount: bigint) {
  const roundedUnits = (amount + FAME_UNIT / 2n) / FAME_UNIT;
  return formatTestAmount(roundedUnits * FAME_UNIT);
}
