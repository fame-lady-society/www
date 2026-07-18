import type { Address } from "viem";
import { closedLoopGallerySwapAbi, fameAbi } from "../../../wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import type { GalleryAdminCall } from "./adminAction";
import type { GalleryPurchaseFingerprint } from "./purchaseQueue";

const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;

export function galleryApprovalContractRequest(
  fingerprint: GalleryPurchaseFingerprint,
) {
  return {
    abi: fameAbi,
    address: config.addresses.fame,
    account: fingerprint.account,
    chainId: config.chainId,
    functionName: "approve",
    args: [fingerprint.allowanceTarget, fingerprint.total],
  } as const;
}

export function galleryFillContractRequest(
  fingerprint: GalleryPurchaseFingerprint,
) {
  return {
    abi: closedLoopGallerySwapAbi,
    address: config.addresses.gallery,
    account: fingerprint.account,
    chainId: config.chainId,
    functionName: "fill",
    args: [fingerprint.tokenId, fingerprint.recipient],
  } as const;
}

export function galleryAdminContractRequest(
  call: GalleryAdminCall,
  account: Address,
) {
  const baseRequest = {
    abi: closedLoopGallerySwapAbi,
    address: config.addresses.gallery,
    account,
    chainId: config.chainId,
  } as const;

  switch (call.kind) {
    case "list":
      return {
        ...baseRequest,
        functionName: "list",
        args: [call.tokenId, call.premium],
      } as const;
    case "set_premium":
      return {
        ...baseRequest,
        functionName: "setPremium",
        args: [call.tokenId, call.premium],
      } as const;
    case "unlist":
      return {
        ...baseRequest,
        functionName: "unlist",
        args: [call.tokenId],
      } as const;
    case "rotate_mint":
      return {
        ...baseRequest,
        functionName: "rotateToMintPool",
        args: [call.tokenId, call.poolTokenId],
      } as const;
    case "rotate_burn":
      return {
        ...baseRequest,
        functionName: "rotateToBurnPool",
        args: [call.tokenId, call.poolTokenId],
      } as const;
    case "rotate_end_of_mint":
      return {
        ...baseRequest,
        functionName: "rotateToEndOfMintPool",
        args: [call.tokenId, call.metadataUri],
      } as const;
    case "withdraw_fees":
      return {
        ...baseRequest,
        functionName: "withdrawAccruedFees",
        args: [call.recipient, call.amount],
      } as const;
  }
}
