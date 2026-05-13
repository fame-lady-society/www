import type { FameSwapQuoteStatus } from "./solver/types";

export type FameSwapWidgetStateKind =
  | "disconnected"
  | "wrong_chain"
  | "amount_entry"
  | "unsupported_route"
  | "stale_artifact"
  | "not_live_ready"
  | "quote_expired"
  | "approval_needed"
  | "ready"
  | "submitting"
  | "confirmed"
  | "reverted";

export interface FameSwapWidgetStateInput {
  connected: boolean;
  onBase: boolean;
  amountEntered: boolean;
  quoteStatus: FameSwapQuoteStatus | null;
  quoteExpired: boolean;
  approvalRequired: boolean;
  submitting: boolean;
  confirmed: boolean;
  reverted: boolean;
  compact: boolean;
}

export interface FameSwapWidgetState {
  kind: FameSwapWidgetStateKind;
  title: string;
  message: string;
  ctaLabel: string;
  ctaDisabled: boolean;
  recoveryAction: string;
  diagnosticsVisible: boolean;
  fallbackVisible: boolean;
  amountDisabled: boolean;
  tokenSelectDisabled: boolean;
}

const defaultState = {
  diagnosticsVisible: false,
  fallbackVisible: false,
  amountDisabled: false,
  tokenSelectDisabled: false,
} satisfies Pick<
  FameSwapWidgetState,
  | "diagnosticsVisible"
  | "fallbackVisible"
  | "amountDisabled"
  | "tokenSelectDisabled"
>;

export function fameSwapWidgetState(
  input: FameSwapWidgetStateInput,
): FameSwapWidgetState {
  if (input.confirmed) {
    return {
      ...defaultState,
      kind: "confirmed",
      title: "Swap confirmed",
      message: "Your FAME router transaction confirmed on Base.",
      ctaLabel: "Swap confirmed",
      ctaDisabled: true,
      recoveryAction: "View the transaction or start another swap.",
      tokenSelectDisabled: true,
    };
  }

  if (input.reverted) {
    return {
      ...defaultState,
      kind: "reverted",
      title: "Swap reverted",
      message: "The transaction did not complete. Review diagnostics before retrying.",
      ctaLabel: "Review diagnostics",
      ctaDisabled: true,
      recoveryAction: "Retry after checking the route and wallet state.",
      diagnosticsVisible: true,
    };
  }

  if (input.submitting) {
    return {
      ...defaultState,
      kind: "submitting",
      title: "Submitting",
      message: "Confirm in your wallet and wait for the Base receipt.",
      ctaLabel: "Submitting",
      ctaDisabled: true,
      recoveryAction: "Wait for the wallet prompt or transaction receipt.",
      amountDisabled: true,
      tokenSelectDisabled: true,
    };
  }

  if (!input.connected) {
    return {
      ...defaultState,
      kind: "disconnected",
      title: "Connect wallet",
      message: "Connect a wallet to prepare a FAME router swap.",
      ctaLabel: "Connect wallet",
      ctaDisabled: false,
      recoveryAction: "Connect a wallet.",
    };
  }

  if (!input.onBase) {
    return {
      ...defaultState,
      kind: "wrong_chain",
      title: "Switch to Base",
      message: "FAME router evidence is pinned for Base.",
      ctaLabel: "Switch to Base",
      ctaDisabled: false,
      recoveryAction: "Switch your wallet network to Base.",
    };
  }

  if (!input.amountEntered || input.quoteStatus === null) {
    return {
      ...defaultState,
      kind: "amount_entry",
      title: "Enter amount",
      message: "Enter the amount you want to swap.",
      ctaLabel: "Enter amount",
      ctaDisabled: true,
      recoveryAction: "Choose a supported pair and enter an amount.",
    };
  }

  if (input.quoteExpired) {
    return {
      ...defaultState,
      kind: "quote_expired",
      title: "Quote expired",
      message: "The route deadline has passed.",
      ctaLabel: "Refresh quote",
      ctaDisabled: true,
      recoveryAction: "Edit the amount or pair to prepare a fresh route.",
      diagnosticsVisible: true,
    };
  }

  if (input.quoteStatus === "unsupported") {
    return {
      ...defaultState,
      kind: "unsupported_route",
      title: "Route unsupported",
      message: "This pair is not available in the pinned FAME route set.",
      ctaLabel: "Choose another pair",
      ctaDisabled: true,
      recoveryAction: "Select FAME with USDC, WETH, or ETH.",
      diagnosticsVisible: true,
    };
  }

  if (input.quoteStatus === "stale_artifact") {
    return {
      ...defaultState,
      kind: "stale_artifact",
      title: "Swap unavailable",
      message: "The route artifact is stale or outside the approved manifest.",
      ctaLabel: "Swap unavailable",
      ctaDisabled: true,
      recoveryAction: "Use an allowlisted fallback link and inspect diagnostics.",
      diagnosticsVisible: true,
      fallbackVisible: true,
    };
  }

  if (input.quoteStatus === "not_live_ready") {
    return {
      ...defaultState,
      kind: "not_live_ready",
      title: "Router unavailable",
      message: "FAME router execution is blocked until live readiness passes.",
      ctaLabel: "Router unavailable",
      ctaDisabled: true,
      recoveryAction: "Use an allowlisted fallback link or inspect route evidence.",
      diagnosticsVisible: true,
      fallbackVisible: true,
    };
  }

  if (input.approvalRequired) {
    return {
      ...defaultState,
      kind: "approval_needed",
      title: "Approve exact amount",
      message: "Approve only the exact input amount for the FAME router.",
      ctaLabel: "Approve exact amount",
      ctaDisabled: false,
      recoveryAction: "Approve the exact amount, then submit the swap.",
    };
  }

  return {
    ...defaultState,
    kind: "ready",
    title: "Ready",
    message: "Pinned exact FAME router evidence amount is ready.",
    ctaLabel: "Swap with FAME router",
    ctaDisabled: false,
    recoveryAction: "Submit the swap or edit the pair and amount.",
  };
}
