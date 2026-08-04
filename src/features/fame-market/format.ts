import { formatUnits } from "viem";

export function formatTestAmount(amount: bigint) {
  const [whole, fraction = ""] = formatUnits(amount, 18).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmedFraction = fraction.replace(/0+$/, "");
  return trimmedFraction ? `${grouped}.${trimmedFraction}` : grouped;
}
