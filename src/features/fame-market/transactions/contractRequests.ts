import type { Address } from "viem";
import { fameAbi, universalPoolArtMarketplaceAbi } from "../../../wagmi";
import type {
  GalleryFrozenBuyerTerms,
  GalleryFulfillmentRoute,
} from "../types";

export function galleryApprovalContractRequest(
  terms: GalleryFrozenBuyerTerms,
  fameAddress: Address,
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
