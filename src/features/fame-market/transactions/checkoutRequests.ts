import { isAddressEqual, type Address } from "viem";
import { fameAbi, fameMarketplaceCheckoutAbi } from "../../../wagmi";
import {
  NATIVE_ETH_ADDRESS,
  type FameRoute,
} from "../../fame-swap/router/types";
import type {
  GalleryArtworkTarget,
  GalleryCheckoutQuote,
  GalleryFrozenBuyerTerms,
  GalleryFulfillmentRoute,
} from "../types";

export function freezeGalleryCheckoutBuyerTerms(input: {
  chainId: number;
  account: Address;
  target: GalleryArtworkTarget;
  quote: GalleryCheckoutQuote;
}): GalleryFrozenBuyerTerms {
  if (!input.target.artworkHash) {
    throw new Error("This artwork is not ready to purchase.");
  }
  const { quote } = input;
  return Object.freeze({
    chainId: input.chainId,
    account: input.account,
    recipient: input.account,
    selectedTarget: Object.freeze({
      targetId: input.target.targetId,
      tokenId: input.target.tokenId,
    }),
    artworkHash: input.target.artworkHash,
    unit: quote.marketplaceUnit,
    maxPremium: quote.maximumPremium,
    maximumSpend: quote.maximumInput,
    allowanceTarget: quote.checkout,
    checkout: Object.freeze({
      paymentAsset: quote.paymentAsset,
      inputToken: quote.inputToken,
      checkout: quote.checkout,
      marketplace: quote.marketplace,
      maximumInput: quote.maximumInput,
      routeHash: quote.routeHash,
      routeDeadline: quote.route.deadline,
      quoteBlockNumber: quote.quoteBlockNumber,
    }),
  });
}

function executableRoute(route: FameRoute) {
  return {
    version: route.version,
    tokenIn: route.tokenIn,
    tokenOut: route.tokenOut,
    amountIn: route.amountIn,
    minAmountOutAfterFee: route.minAmountOutAfterFee,
    recipient: route.recipient,
    deadline: route.deadline,
    legs: route.legs.map((leg) => ({
      tokenIn: leg.tokenIn,
      tokenOut: leg.tokenOut,
      venue: leg.venueOrdinal,
      amountMode: leg.amountModeOrdinal,
      amount: leg.amount,
      minAmountOut: leg.minAmountOut,
      target: leg.target,
      data: leg.data,
    })),
  } as const;
}

function requireCheckoutConsent(
  terms: GalleryFrozenBuyerTerms,
  quote: GalleryCheckoutQuote,
) {
  const consent = terms.checkout;
  if (!consent) throw new Error("Alternative checkout consent is missing.");
  if (
    consent.paymentAsset !== quote.paymentAsset ||
    !isAddressEqual(consent.inputToken, quote.inputToken) ||
    !isAddressEqual(consent.checkout, quote.checkout) ||
    !isAddressEqual(consent.marketplace, quote.marketplace) ||
    consent.maximumInput !== quote.maximumInput ||
    consent.routeHash !== quote.routeHash ||
    consent.routeDeadline !== quote.route.deadline ||
    consent.quoteBlockNumber !== quote.quoteBlockNumber ||
    !isAddressEqual(quote.route.recipient, quote.checkout) ||
    quote.route.amountIn !== quote.maximumInput ||
    quote.maximumPremium !== terms.maxPremium ||
    quote.marketplaceUnit !== terms.unit ||
    !isAddressEqual(quote.marketplace, terms.checkout.marketplace) ||
    !isAddressEqual(quote.checkout, terms.allowanceTarget)
  ) {
    throw new Error("The checkout quote no longer matches buyer consent.");
  }
}

export function galleryCheckoutApprovalContractRequest(
  terms: GalleryFrozenBuyerTerms,
  quote: GalleryCheckoutQuote,
) {
  requireCheckoutConsent(terms, quote);
  if (quote.paymentAsset === "ETH") return null;
  return {
    abi: fameAbi,
    address: quote.inputToken,
    account: terms.account,
    chainId: terms.chainId,
    functionName: "approve",
    args: [quote.checkout, quote.maximumInput],
  } as const;
}

export function galleryCheckoutContractRequest(
  terms: GalleryFrozenBuyerTerms,
  fulfillment: GalleryFulfillmentRoute,
  quote: GalleryCheckoutQuote,
) {
  requireCheckoutConsent(terms, quote);
  const baseRequest = {
    abi: fameMarketplaceCheckoutAbi,
    address: quote.checkout,
    account: terms.account,
    chainId: terms.chainId,
    value: quote.inputToken === NATIVE_ETH_ADDRESS ? quote.maximumInput : 0n,
  } as const;
  const route = executableRoute(quote.route);
  if (fulfillment.kind === "held") {
    return {
      ...baseRequest,
      functionName: "checkoutHeld",
      args: [
        route,
        fulfillment.shellId,
        terms.artworkHash,
        terms.maxPremium,
        0n,
      ],
    } as const;
  }
  return {
    ...baseRequest,
    functionName: "checkoutPool",
    args: [
      route,
      fulfillment.shellId,
      fulfillment.sourceId,
      terms.artworkHash,
      terms.maxPremium,
      0n,
    ],
  } as const;
}

export function galleryCheckoutAllowanceRequest(input: {
  owner: Address;
  quote: GalleryCheckoutQuote;
}) {
  if (input.quote.paymentAsset === "ETH") return null;
  return {
    abi: fameAbi,
    address: input.quote.inputToken,
    functionName: "allowance",
    args: [input.owner, input.quote.checkout],
  } as const;
}
