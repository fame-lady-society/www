import type { Address } from "viem";
import { fameAbi, universalPoolArtMarketplaceAbi } from "../../../wagmi";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import type {
  GalleryAdminCall,
  GalleryFrozenBuyerTerms,
  GalleryFulfillmentRoute,
} from "../types";

const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;

export function galleryApprovalContractRequest(
  terms: GalleryFrozenBuyerTerms,
  fameAddress: Address = config.addresses.fame,
) {
  return {
    abi: fameAbi,
    address: fameAddress,
    account: terms.account,
    chainId: terms.chainId,
    functionName: "approve",
    args: [terms.allowanceTarget, terms.unit + terms.maxPremium],
  } as const;
}

export function galleryPurchaseContractRequest(
  terms: GalleryFrozenBuyerTerms,
  route: GalleryFulfillmentRoute,
) {
  const baseRequest = {
    abi: universalPoolArtMarketplaceAbi,
    address: terms.allowanceTarget,
    account: terms.account,
    chainId: terms.chainId,
  } as const;

  if (route.kind === "held") {
    return {
      ...baseRequest,
      functionName: "purchaseHeld",
      args: [
        route.shellId,
        terms.artworkHash,
        terms.maxPremium,
        0n,
        terms.recipient,
      ],
    } as const;
  }

  return {
    ...baseRequest,
    functionName: "purchasePool",
    args: [
      route.shellId,
      route.sourceId,
      terms.artworkHash,
      terms.maxPremium,
      0n,
      terms.recipient,
    ],
  } as const;
}

export function galleryAdminContractRequest(
  call: GalleryAdminCall,
  account: Address,
) {
  const baseRequest = {
    abi: universalPoolArtMarketplaceAbi,
    address: config.addresses.gallery,
    account,
    chainId: config.chainId,
  } as const;

  switch (call.kind) {
    case "set_premium":
      return {
        ...baseRequest,
        functionName: "setPremium",
        args: [call.premium],
      } as const;
    case "set_fee_recipient":
      return {
        ...baseRequest,
        functionName: "setFeeRecipient",
        args: [call.feeRecipient],
      } as const;
    case "pause":
      return {
        ...baseRequest,
        functionName: "pause",
        args: [],
      } as const;
    case "unpause":
      return {
        ...baseRequest,
        functionName: "unpause",
        args: [],
      } as const;
  }
}
