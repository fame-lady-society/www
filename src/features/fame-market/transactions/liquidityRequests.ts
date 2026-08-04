import type { Address } from "viem";
import {
  fameAbi,
  fameMirrorAbi,
  universalPoolArtMarketplaceAbi,
} from "../../../wagmi";
import {
  SOCIETY_TOKEN_ID_END_EXCLUSIVE,
  SOCIETY_TOKEN_ID_START,
} from "../redemption/ownedSociety";
import type { GalleryLiquidityCall } from "./liquidityAction";

export const GALLERY_LIQUIDITY_BATCH_LIMIT = 8;

function validatedSocietyTokenId(tokenId: bigint) {
  if (
    tokenId < SOCIETY_TOKEN_ID_START ||
    tokenId >= SOCIETY_TOKEN_ID_END_EXCLUSIVE
  ) {
    throw new Error("Society token IDs must be between 1 and 888.");
  }
  return tokenId;
}

export function normalizeLiquidityDepositTokenIds(tokenIds: readonly bigint[]) {
  if (
    tokenIds.length === 0 ||
    tokenIds.length > GALLERY_LIQUIDITY_BATCH_LIMIT
  ) {
    throw new Error("Select between 1 and 8 Society NFTs.");
  }
  const normalized = tokenIds
    .map(validatedSocietyTokenId)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  if (new Set(normalized).size !== normalized.length) {
    throw new Error("Selected Society token IDs must be unique.");
  }
  return normalized;
}

export function galleryLiquidityDepositApprovalReadRequest(
  account: Address,
  mirror: Address,
  marketplace: Address,
) {
  return {
    abi: fameMirrorAbi,
    address: mirror,
    functionName: "isApprovedForAll",
    args: [account, marketplace],
  } as const;
}

export function galleryLiquidityDepositApprovalRequest(
  account: Address,
  chainId: number,
  mirror: Address,
  marketplace: Address,
) {
  return {
    abi: fameMirrorAbi,
    address: mirror,
    account,
    chainId,
    functionName: "setApprovalForAll",
    args: [marketplace, true],
  } as const;
}

export function galleryLiquidityDepositRequest(
  account: Address,
  chainId: number,
  marketplace: Address,
  tokenIds: readonly bigint[],
) {
  return {
    abi: universalPoolArtMarketplaceAbi,
    address: marketplace,
    account,
    chainId,
    functionName: "depositInventoryBatch",
    args: [normalizeLiquidityDepositTokenIds(tokenIds)],
  } as const;
}

export function galleryLiquidityFameAllowanceRequest(
  account: Address,
  fame: Address,
  marketplace: Address,
) {
  return {
    abi: fameAbi,
    address: fame,
    functionName: "allowance",
    args: [account, marketplace],
  } as const;
}

export function galleryLiquidityFameApprovalRequest(
  account: Address,
  chainId: number,
  fame: Address,
  marketplace: Address,
  amount: bigint,
) {
  if (amount < 0n) throw new Error("FAME approval cannot be negative.");
  return {
    abi: fameAbi,
    address: fame,
    account,
    chainId,
    functionName: "approve",
    args: [marketplace, amount],
  } as const;
}

export function galleryLiquidityRandomWithdrawalRequest(
  account: Address,
  chainId: number,
  marketplace: Address,
) {
  return {
    abi: universalPoolArtMarketplaceAbi,
    address: marketplace,
    account,
    chainId,
    functionName: "withdrawInventory",
    args: [],
  } as const;
}

export function galleryLiquiditySelectedWithdrawalRequest(
  account: Address,
  chainId: number,
  marketplace: Address,
  tokenId: bigint,
  maxPremium: bigint,
) {
  if (maxPremium < 0n) throw new Error("Maximum premium cannot be negative.");
  return {
    abi: universalPoolArtMarketplaceAbi,
    address: marketplace,
    account,
    chainId,
    functionName: "withdrawInventorySelected",
    args: [validatedSocietyTokenId(tokenId), maxPremium],
  } as const;
}

export function galleryLiquidityContractRequest(
  call: GalleryLiquidityCall,
  account: Address,
  chainId: number,
  addresses: { fame: Address; marketplace: Address },
) {
  switch (call.kind) {
    case "deposit":
      return galleryLiquidityDepositRequest(
        account,
        chainId,
        addresses.marketplace,
        call.tokenIds,
      );
    case "selected_withdrawal_approval":
      return galleryLiquidityFameApprovalRequest(
        account,
        chainId,
        addresses.fame,
        addresses.marketplace,
        call.amount,
      );
    case "random_withdrawal":
      return galleryLiquidityRandomWithdrawalRequest(
        account,
        chainId,
        addresses.marketplace,
      );
    case "selected_withdrawal":
      return galleryLiquiditySelectedWithdrawalRequest(
        account,
        chainId,
        addresses.marketplace,
        call.tokenId,
        call.maxPremium,
      );
  }
}
