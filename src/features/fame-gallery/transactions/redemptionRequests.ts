import type { Address } from "viem";
import { fameMarketplaceCheckoutAbi, fameMirrorAbi } from "../../../wagmi";
import { fameRouteToCall } from "../../fame-swap/router/callRoute";
import type { GalleryRedemptionQuote } from "../types";

export function galleryRedemptionApprovalReadRequest(
  account: Address,
  mirror: Address,
  checkout: Address,
) {
  return {
    abi: fameMirrorAbi,
    address: mirror,
    functionName: "isApprovedForAll",
    args: [account, checkout],
  } as const;
}

export function galleryRedemptionApprovalRequest(
  account: Address,
  chainId: number,
  mirror: Address,
  checkout: Address,
) {
  return {
    abi: fameMirrorAbi,
    address: mirror,
    account,
    chainId,
    functionName: "setApprovalForAll",
    args: [checkout, true],
  } as const;
}

export function galleryRedemptionRequest(quote: GalleryRedemptionQuote) {
  return {
    abi: fameMarketplaceCheckoutAbi,
    address: quote.checkout,
    account: quote.account,
    chainId: quote.chainId,
    functionName: "redeemSociety",
    args: [fameRouteToCall(quote.route), [...quote.tokenIds]],
  } as const;
}
