import type { Address } from "viem";

const BASE_GAS_RESERVE_WEI = 21_000n * 20n;

export type CreatorUploadFundingSnapshot = {
  sponsorAddress: Address | null;
  baseBalanceWei: string | null;
  baseBalanceEth: string | null;
  loadedIrysBalanceWei: string | null;
  loadedIrysBalanceEth: string | null;
  estimatedUploadWei: string | null;
  estimatedUploadEth: string | null;
  estimatedImages: number | null;
  imageBytes: number | null;
  baseGasReserveEth: string;
  error: string | null;
};

export function estimateCreatorImagesRemaining(
  baseBalanceWei: bigint,
  estimatedUploadWei: bigint,
  loadedIrysBalanceWei = 0n,
) {
  if (estimatedUploadWei <= 0n) {
    return 0;
  }
  const availableBase =
    baseBalanceWei > BASE_GAS_RESERVE_WEI
      ? baseBalanceWei - BASE_GAS_RESERVE_WEI
      : 0n;
  const availableIrys = loadedIrysBalanceWei > 0n ? loadedIrysBalanceWei : 0n;
  const count = (availableBase + availableIrys) / estimatedUploadWei;
  return count > BigInt(Number.MAX_SAFE_INTEGER)
    ? Number.MAX_SAFE_INTEGER
    : Number(count);
}
