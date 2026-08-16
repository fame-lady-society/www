import type { Address } from "viem";

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
