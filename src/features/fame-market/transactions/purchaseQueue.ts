import type { Hash } from "viem";
import type {
  GalleryFrozenBuyerTerms,
  GalleryFulfillmentRoute,
  GalleryVerifiedAcquisition,
} from "../types";
import type {
  GalleryPurchaseReceipt,
  GalleryPurchaseVerificationResult,
} from "./verifyPurchase";

export type GalleryPurchaseStatus =
  | "idle"
  | "connecting"
  | "switching_chain"
  | "checking_allowance"
  | "simulating_approval"
  | "awaiting_approval_wallet"
  | "confirming_approval"
  | "resolving_fulfillment"
  | "simulating_purchase"
  | "awaiting_purchase_wallet"
  | "confirming_purchase"
  | "verifying"
  | "confirmed_unverified"
  | "refreshing"
  | "verified"
  | "error";

export type GalleryPurchaseErrorStage =
  | "connection"
  | "switch_chain"
  | "balance"
  | "allowance"
  | "approval_simulation"
  | "approval_wallet"
  | "approval_receipt"
  | "fulfillment"
  | "purchase_simulation"
  | "purchase_wallet"
  | "purchase_receipt"
  | "verification"
  | "refresh";

export type GalleryPurchaseFailure = {
  stage: GalleryPurchaseErrorStage;
  cause: unknown;
};

export type GalleryPurchaseState = {
  status: GalleryPurchaseStatus;
  terms: GalleryFrozenBuyerTerms | null;
  approvalHash: Hash | null;
  purchaseHash: Hash | null;
  failure: GalleryPurchaseFailure | null;
  acquisition: GalleryVerifiedAcquisition | null;
  refreshFailure: unknown | null;
};

export const initialGalleryPurchaseState: GalleryPurchaseState = {
  status: "idle",
  terms: null,
  approvalHash: null,
  purchaseHash: null,
  failure: null,
  acquisition: null,
  refreshFailure: null,
};

export type GalleryPurchaseEvent =
  | { type: "connecting" }
  | { type: "switching_chain" }
  | { type: "started"; terms: GalleryFrozenBuyerTerms }
  | { type: "checking_allowance" }
  | { type: "simulating_approval" }
  | { type: "awaiting_approval_wallet" }
  | { type: "approval_submitted"; hash: Hash }
  | { type: "resolving_fulfillment" }
  | { type: "simulating_purchase" }
  | { type: "awaiting_purchase_wallet" }
  | { type: "purchase_submitted"; hash: Hash }
  | { type: "verifying" }
  | { type: "verification_failed"; cause: unknown }
  | { type: "refreshing"; acquisition: GalleryVerifiedAcquisition }
  | { type: "refreshing_receipt" }
  | { type: "verified"; acquisition: GalleryVerifiedAcquisition }
  | { type: "verified_receipt" }
  | {
      type: "refresh_failed";
      acquisition: GalleryVerifiedAcquisition;
      cause: unknown;
    }
  | { type: "refresh_receipt_failed"; cause: unknown }
  | { type: "failed"; stage: GalleryPurchaseErrorStage; cause: unknown }
  | { type: "reset" };

export function galleryPurchaseReducer(
  state: GalleryPurchaseState,
  event: GalleryPurchaseEvent,
): GalleryPurchaseState {
  switch (event.type) {
    case "connecting":
      return { ...initialGalleryPurchaseState, status: "connecting" };
    case "switching_chain":
      return { ...state, status: "switching_chain", failure: null };
    case "started":
      return {
        ...initialGalleryPurchaseState,
        status: "checking_allowance",
        terms: event.terms,
      };
    case "checking_allowance":
    case "simulating_approval":
    case "awaiting_approval_wallet":
    case "resolving_fulfillment":
    case "simulating_purchase":
    case "awaiting_purchase_wallet":
    case "verifying":
      return { ...state, status: event.type, failure: null };
    case "approval_submitted":
      return {
        ...state,
        status: "confirming_approval",
        approvalHash: event.hash,
        failure: null,
      };
    case "purchase_submitted":
      return {
        ...state,
        status: "confirming_purchase",
        purchaseHash: event.hash,
        failure: null,
      };
    case "verification_failed":
      return {
        ...state,
        status: "confirmed_unverified",
        failure: { stage: "verification", cause: event.cause },
      };
    case "refreshing":
      return {
        ...state,
        status: "refreshing",
        acquisition: event.acquisition,
        failure: null,
      };
    case "refreshing_receipt":
      return {
        ...state,
        status: "refreshing",
        acquisition: null,
        failure: null,
      };
    case "verified":
      return {
        ...state,
        status: "verified",
        acquisition: event.acquisition,
        failure: null,
        refreshFailure: null,
      };
    case "verified_receipt":
      return {
        ...state,
        status: "verified",
        acquisition: null,
        failure: null,
        refreshFailure: null,
      };
    case "refresh_failed":
      return {
        ...state,
        status: "verified",
        acquisition: event.acquisition,
        failure: null,
        refreshFailure: event.cause,
      };
    case "refresh_receipt_failed":
      return {
        ...state,
        status: "verified",
        acquisition: null,
        failure: null,
        refreshFailure: event.cause,
      };
    case "failed":
      return {
        ...state,
        status: "error",
        failure: { stage: event.stage, cause: event.cause },
      };
    case "reset":
      return initialGalleryPurchaseState;
  }
}

export type GallerySimulatedWrite = {
  request: unknown;
};

export type GalleryResolvedPurchase = {
  route: GalleryFulfillmentRoute;
};

export type GalleryPurchaseDependencies = {
  dispatch: (event: GalleryPurchaseEvent) => void;
  readBalance?: (terms: GalleryFrozenBuyerTerms) => Promise<bigint>;
  readAllowance: (terms: GalleryFrozenBuyerTerms) => Promise<bigint>;
  simulateApproval: (
    terms: GalleryFrozenBuyerTerms,
  ) => Promise<GallerySimulatedWrite>;
  writeApproval: (request: unknown) => Promise<Hash>;
  resolveFulfillment: (input: {
    terms: GalleryFrozenBuyerTerms;
    allowShellRecovery: boolean;
  }) => Promise<GalleryResolvedPurchase>;
  simulatePurchase: (
    terms: GalleryFrozenBuyerTerms,
    route: GalleryFulfillmentRoute,
  ) => Promise<GallerySimulatedWrite>;
  writePurchase: (request: unknown) => Promise<Hash>;
  waitForReceipt: (
    hash: Hash,
    confirmations: 1 | 2 | 3,
  ) => Promise<GalleryPurchaseReceipt>;
  verifyPurchase?: (input: {
    receipt: GalleryPurchaseReceipt;
    hash: Hash;
    terms: GalleryFrozenBuyerTerms;
    route: GalleryFulfillmentRoute;
  }) => Promise<GalleryPurchaseVerificationResult>;
  refreshAfterPurchase: (
    acquisition: GalleryVerifiedAcquisition,
  ) => Promise<void>;
  refreshAfterReceipt?: () => Promise<void>;
};

export type GalleryPurchaseExecutionResult =
  | {
      status: "verified";
      acquisition: GalleryVerifiedAcquisition | null;
    }
  | { status: "confirmed_unverified"; cause: unknown }
  | { status: "failed"; stage: GalleryPurchaseErrorStage; cause: unknown };

function failure(
  dependencies: GalleryPurchaseDependencies,
  stage: GalleryPurchaseErrorStage,
  cause: unknown,
): GalleryPurchaseExecutionResult {
  dependencies.dispatch({ type: "failed", stage, cause });
  return { status: "failed", stage, cause };
}

function verificationFailure(
  dependencies: GalleryPurchaseDependencies,
  cause: unknown,
): GalleryPurchaseExecutionResult {
  dependencies.dispatch({ type: "verification_failed", cause });
  return { status: "confirmed_unverified", cause };
}

function revertedTransaction(kind: "approval" | "purchase") {
  return new Error(`The ${kind} transaction reverted onchain.`);
}

export async function executeGalleryPurchase({
  terms,
  allowShellRecovery = false,
  dependencies,
}: {
  terms: GalleryFrozenBuyerTerms;
  allowShellRecovery?: boolean;
  dependencies: GalleryPurchaseDependencies;
}): Promise<GalleryPurchaseExecutionResult> {
  dependencies.dispatch({ type: "started", terms });

  if (dependencies.readBalance) {
    let balance: bigint;
    try {
      balance = await dependencies.readBalance(terms);
    } catch (cause) {
      return failure(dependencies, "balance", cause);
    }
    if (balance < terms.maximumSpend) {
      return failure(
        dependencies,
        "balance",
        new Error("The selected payment balance is below the maximum input."),
      );
    }
  }

  let allowance: bigint;
  try {
    dependencies.dispatch({ type: "checking_allowance" });
    allowance = await dependencies.readAllowance(terms);
  } catch (cause) {
    return failure(dependencies, "allowance", cause);
  }

  if (allowance < terms.maximumSpend) {
    let approval: GallerySimulatedWrite;
    try {
      dependencies.dispatch({ type: "simulating_approval" });
      approval = await dependencies.simulateApproval(terms);
    } catch (cause) {
      return failure(dependencies, "approval_simulation", cause);
    }

    let approvalHash: Hash;
    try {
      dependencies.dispatch({ type: "awaiting_approval_wallet" });
      approvalHash = await dependencies.writeApproval(approval.request);
      dependencies.dispatch({ type: "approval_submitted", hash: approvalHash });
    } catch (cause) {
      return failure(dependencies, "approval_wallet", cause);
    }

    let approvalReceipt: GalleryPurchaseReceipt;
    try {
      approvalReceipt = await dependencies.waitForReceipt(approvalHash, 1);
    } catch (cause) {
      return failure(dependencies, "approval_receipt", cause);
    }
    if (approvalReceipt.status !== "success") {
      return failure(
        dependencies,
        "approval_receipt",
        revertedTransaction("approval"),
      );
    }
  }

  let resolved: GalleryResolvedPurchase;
  try {
    dependencies.dispatch({ type: "resolving_fulfillment" });
    resolved = await dependencies.resolveFulfillment({
      terms,
      allowShellRecovery,
    });
  } catch (cause) {
    return failure(dependencies, "fulfillment", cause);
  }

  let purchase: GallerySimulatedWrite;
  try {
    dependencies.dispatch({ type: "simulating_purchase" });
    purchase = await dependencies.simulatePurchase(terms, resolved.route);
  } catch (cause) {
    return failure(dependencies, "purchase_simulation", cause);
  }

  let purchaseHash: Hash;
  try {
    dependencies.dispatch({ type: "awaiting_purchase_wallet" });
    purchaseHash = await dependencies.writePurchase(purchase.request);
    dependencies.dispatch({ type: "purchase_submitted", hash: purchaseHash });
  } catch (cause) {
    return failure(dependencies, "purchase_wallet", cause);
  }

  let purchaseReceipt: GalleryPurchaseReceipt;
  try {
    purchaseReceipt = await dependencies.waitForReceipt(purchaseHash, 1);
  } catch (cause) {
    return failure(dependencies, "purchase_receipt", cause);
  }
  if (purchaseReceipt.status !== "success") {
    return failure(
      dependencies,
      "purchase_receipt",
      revertedTransaction("purchase"),
    );
  }

  if (!dependencies.verifyPurchase) {
    dependencies.dispatch({ type: "refreshing_receipt" });
    try {
      if (!dependencies.refreshAfterReceipt) {
        throw new Error("Receipt refresh is not configured.");
      }
      await dependencies.refreshAfterReceipt();
      dependencies.dispatch({ type: "verified_receipt" });
    } catch (cause) {
      dependencies.dispatch({ type: "refresh_receipt_failed", cause });
    }
    return { status: "verified", acquisition: null };
  }

  let verification: GalleryPurchaseVerificationResult;
  try {
    dependencies.dispatch({ type: "verifying" });
    verification = await dependencies.verifyPurchase({
      receipt: purchaseReceipt,
      hash: purchaseHash,
      terms,
      route: resolved.route,
    });
  } catch (cause) {
    return verificationFailure(dependencies, cause);
  }
  if (verification.status !== "verified") {
    return verificationFailure(
      dependencies,
      verification.cause ?? new Error(verification.reason),
    );
  }

  dependencies.dispatch({
    type: "refreshing",
    acquisition: verification.acquisition,
  });
  try {
    await dependencies.refreshAfterPurchase(verification.acquisition);
    dependencies.dispatch({
      type: "verified",
      acquisition: verification.acquisition,
    });
  } catch (cause) {
    dependencies.dispatch({
      type: "refresh_failed",
      acquisition: verification.acquisition,
      cause,
    });
  }

  return { status: "verified", acquisition: verification.acquisition };
}
