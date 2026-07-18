import { isAddressEqual, type Address, type Hash, type Hex } from "viem";
import type { ReplacementReason } from "viem/actions";

export type GalleryPurchaseTransactionKind = "approval" | "fill";

export type GalleryPurchaseStatus =
  | "idle"
  | "preparing"
  | "switching_chain"
  | "simulating"
  | "awaiting_wallet"
  | "confirming_approval"
  | "approval_confirmed"
  | "confirming_fill"
  | "fill_receipt_confirmed"
  | "verifying"
  | "verified"
  | "confirmed_refreshing"
  | "confirmed_unverified"
  | "outcome_unknown"
  | "error";

export type GalleryPurchaseErrorStage =
  | "connection"
  | "switch_chain"
  | "context"
  | "simulation"
  | "wallet"
  | "receipt"
  | "replacement";

export type GalleryPurchaseFingerprint = {
  chainId: number;
  account: Address;
  recipient: Address;
  tokenId: bigint;
  unit: bigint;
  premium: bigint;
  total: bigint;
  allowanceTarget: Address;
  fillCalldata: Hex;
};

export type GalleryPurchaseSnapshot = {
  blockNumber: bigint;
  allowance: bigint;
  inventory: bigint;
  accruedProtocolFees: bigint;
  fingerprint: GalleryPurchaseFingerprint;
};

export type GalleryPurchaseFailure = {
  stage: GalleryPurchaseErrorStage;
  cause: unknown;
};

export type GalleryAcquiredNft = {
  transactionHash: Hash;
  receiptBlockNumber: bigint;
  buyer: Address;
  recipient: Address;
  tokenId: bigint;
  unit: bigint;
  premium: bigint;
  total: bigint;
  inventoryBefore: bigint;
  inventoryAfter: bigint;
  receiptBlockInventory: bigint;
  receiptBlockAccruedFees: bigint;
  currentOwner: Address;
  listingActive: boolean;
  tokenUri: string | null;
};

export type GalleryPurchaseState = {
  status: GalleryPurchaseStatus;
  transactionKind: GalleryPurchaseTransactionKind | null;
  fingerprint: GalleryPurchaseFingerprint | null;
  preFillSnapshot: GalleryPurchaseSnapshot | null;
  approvalHash: Hash | null;
  fillHash: Hash | null;
  approvalConfirmations: number;
  replacement: {
    kind: GalleryPurchaseTransactionKind;
    reason: ReplacementReason;
    hash: Hash;
  } | null;
  failure: GalleryPurchaseFailure | null;
  acquiredNft: GalleryAcquiredNft | null;
  unverifiedReason: string | null;
};

export const initialGalleryPurchaseState: GalleryPurchaseState = {
  status: "idle",
  transactionKind: null,
  fingerprint: null,
  preFillSnapshot: null,
  approvalHash: null,
  fillHash: null,
  approvalConfirmations: 0,
  replacement: null,
  failure: null,
  acquiredNft: null,
  unverifiedReason: null,
};

export type GalleryPurchaseEvent =
  | { type: "started" }
  | { type: "switching_chain" }
  | { type: "frozen"; snapshot: GalleryPurchaseSnapshot }
  | { type: "simulating"; kind: GalleryPurchaseTransactionKind }
  | { type: "wallet_requested"; kind: GalleryPurchaseTransactionKind }
  | {
      type: "broadcast";
      kind: GalleryPurchaseTransactionKind;
      hash: Hash;
    }
  | {
      type: "replacement";
      kind: GalleryPurchaseTransactionKind;
      reason: ReplacementReason;
      hash: Hash;
    }
  | { type: "approval_confirmed"; confirmations: number }
  | { type: "pre_fill"; snapshot: GalleryPurchaseSnapshot }
  | { type: "fill_receipt_confirmed" }
  | { type: "verifying" }
  | { type: "verified"; acquiredNft: GalleryAcquiredNft }
  | { type: "confirmed_refreshing"; cause: unknown }
  | { type: "confirmed_unverified"; reason: string }
  | {
      type: "outcome_unknown";
      kind: GalleryPurchaseTransactionKind;
      cause: unknown;
    }
  | {
      type: "failed";
      stage: GalleryPurchaseErrorStage;
      cause: unknown;
    }
  | { type: "reset" };

export function galleryPurchaseReducer(
  state: GalleryPurchaseState,
  event: GalleryPurchaseEvent,
): GalleryPurchaseState {
  switch (event.type) {
    case "started":
      return { ...initialGalleryPurchaseState, status: "preparing" };
    case "switching_chain":
      return { ...state, status: "switching_chain", failure: null };
    case "frozen":
      return {
        ...state,
        status: "preparing",
        fingerprint: event.snapshot.fingerprint,
      };
    case "simulating":
      return {
        ...state,
        status: "simulating",
        transactionKind: event.kind,
        failure: null,
      };
    case "wallet_requested":
      return {
        ...state,
        status: "awaiting_wallet",
        transactionKind: event.kind,
        failure: null,
      };
    case "broadcast":
      return {
        ...state,
        status:
          event.kind === "approval" ? "confirming_approval" : "confirming_fill",
        transactionKind: event.kind,
        approvalHash:
          event.kind === "approval" ? event.hash : state.approvalHash,
        fillHash: event.kind === "fill" ? event.hash : state.fillHash,
      };
    case "replacement":
      return {
        ...state,
        approvalHash:
          event.kind === "approval" ? event.hash : state.approvalHash,
        fillHash: event.kind === "fill" ? event.hash : state.fillHash,
        replacement: {
          kind: event.kind,
          reason: event.reason,
          hash: event.hash,
        },
      };
    case "approval_confirmed":
      return {
        ...state,
        status: "approval_confirmed",
        transactionKind: "approval",
        approvalConfirmations: event.confirmations,
      };
    case "pre_fill":
      return { ...state, preFillSnapshot: event.snapshot };
    case "fill_receipt_confirmed":
      return {
        ...state,
        status: "fill_receipt_confirmed",
        transactionKind: "fill",
        failure: null,
      };
    case "verifying":
      return {
        ...state,
        status: "verifying",
        transactionKind: "fill",
        failure: null,
        unverifiedReason: null,
      };
    case "verified":
      return {
        ...state,
        status: "verified",
        transactionKind: "fill",
        acquiredNft: event.acquiredNft,
        failure: null,
        unverifiedReason: null,
      };
    case "confirmed_refreshing":
      return {
        ...state,
        status: "confirmed_refreshing",
        transactionKind: "fill",
        failure: { stage: "receipt", cause: event.cause },
        unverifiedReason: null,
      };
    case "confirmed_unverified":
      return {
        ...state,
        status: "confirmed_unverified",
        transactionKind: "fill",
        failure: null,
        unverifiedReason: event.reason,
      };
    case "outcome_unknown":
      return {
        ...state,
        status: "outcome_unknown",
        transactionKind: event.kind,
        failure: { stage: "receipt", cause: event.cause },
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

export type GalleryWalletContext = {
  account: Address | null;
  chainId: number | undefined;
};

export type GalleryPurchaseRequest = {
  tokenId: bigint;
  recipient?: Address;
  targetChainId: number;
};

export type GalleryPurchaseReplacement = {
  reason: ReplacementReason;
  hash: Hash;
};

export type GalleryPurchaseReceipt = {
  status: "success" | "reverted";
  blockNumber?: bigint;
  transactionHash?: Hash;
  logs?: readonly GalleryTransactionLog[];
};

export type GalleryTransactionLog = {
  address: Address;
  data: Hex;
  topics: readonly Hex[];
  blockNumber?: bigint;
  transactionHash?: Hash;
  transactionIndex?: number;
  logIndex: number;
};

export type GalleryPreparedWrite = unknown;

export type GalleryPurchaseDependencies = {
  dispatch: (event: GalleryPurchaseEvent) => void;
  getWalletContext: () => GalleryWalletContext | Promise<GalleryWalletContext>;
  switchChain: (chainId: number) => Promise<unknown>;
  captureSnapshot: (input: {
    account: Address;
    recipient: Address;
    tokenId: bigint;
    targetChainId: number;
  }) => Promise<GalleryPurchaseSnapshot>;
  simulateApproval: (
    fingerprint: GalleryPurchaseFingerprint,
  ) => Promise<GalleryPreparedWrite>;
  writeApproval: (
    request: GalleryPreparedWrite,
    fingerprint: GalleryPurchaseFingerprint,
  ) => Promise<Hash>;
  simulateFill: (
    fingerprint: GalleryPurchaseFingerprint,
  ) => Promise<GalleryPreparedWrite>;
  writeFill: (
    request: GalleryPreparedWrite,
    fingerprint: GalleryPurchaseFingerprint,
  ) => Promise<Hash>;
  waitForReceipt: (input: {
    hash: Hash;
    confirmations: number;
    onReplaced: (replacement: GalleryPurchaseReplacement) => void;
  }) => Promise<GalleryPurchaseReceipt>;
};

export type ExecuteGalleryPurchaseResult =
  | {
      status: "fill_receipt_confirmed";
      approvalHash: Hash | null;
      fillHash: Hash;
      fingerprint: GalleryPurchaseFingerprint;
      preFillSnapshot: GalleryPurchaseSnapshot;
      receipt: GalleryPurchaseReceipt;
    }
  | {
      status: "outcome_unknown";
      kind: GalleryPurchaseTransactionKind;
      hash: Hash;
      cause: unknown;
    }
  | {
      status: "failed";
      stage: GalleryPurchaseErrorStage;
      cause: unknown;
    };

export function sameGalleryPurchaseFingerprint(
  left: GalleryPurchaseFingerprint,
  right: GalleryPurchaseFingerprint,
) {
  return (
    left.chainId === right.chainId &&
    isAddressEqual(left.account, right.account) &&
    isAddressEqual(left.recipient, right.recipient) &&
    left.tokenId === right.tokenId &&
    left.unit === right.unit &&
    left.premium === right.premium &&
    left.total === right.total &&
    isAddressEqual(left.allowanceTarget, right.allowanceTarget) &&
    left.fillCalldata === right.fillCalldata
  );
}

async function walletContextMatches(
  dependencies: GalleryPurchaseDependencies,
  fingerprint: GalleryPurchaseFingerprint,
) {
  const context = await dependencies.getWalletContext();
  return (
    context.chainId === fingerprint.chainId &&
    context.account !== null &&
    isAddressEqual(context.account, fingerprint.account)
  );
}

function contextChangedError() {
  return new Error(
    "The connected wallet, chain, or frozen purchase terms changed before the next wallet request.",
  );
}

type KnownReceiptResult =
  | {
      status: "success";
      hash: Hash;
      receipt: GalleryPurchaseReceipt;
    }
  | {
      status: "outcome_unknown";
      hash: Hash;
      cause: unknown;
    }
  | {
      status: "failed";
      hash: Hash;
      cause: unknown;
    };

async function waitForKnownReceipt({
  dependencies,
  kind,
  hash,
  confirmations,
}: {
  dependencies: GalleryPurchaseDependencies;
  kind: GalleryPurchaseTransactionKind;
  hash: Hash;
  confirmations: number;
}): Promise<KnownReceiptResult> {
  let currentHash = hash;
  let incompatibleReplacement: GalleryPurchaseReplacement | null = null;

  try {
    const receipt = await dependencies.waitForReceipt({
      hash: currentHash,
      confirmations,
      onReplaced(replacement) {
        currentHash = replacement.hash;
        dependencies.dispatch({
          type: "replacement",
          kind,
          reason: replacement.reason,
          hash: replacement.hash,
        });
        if (replacement.reason !== "repriced") {
          incompatibleReplacement = replacement;
        }
      },
    });

    if (incompatibleReplacement) {
      const replacement: GalleryPurchaseReplacement = incompatibleReplacement;
      return {
        status: "failed",
        hash: replacement.hash,
        cause: new Error(
          replacement.reason === "cancelled"
            ? "The replacement cancelled this transaction."
            : "A different transaction replaced this request.",
        ),
      };
    }
    if (receipt.status === "reverted") {
      return {
        status: "failed",
        hash: currentHash,
        cause: new Error("The transaction reverted onchain."),
      };
    }
    return { status: "success", hash: currentHash, receipt };
  } catch (cause) {
    if (incompatibleReplacement) {
      const replacement: GalleryPurchaseReplacement = incompatibleReplacement;
      return {
        status: "failed",
        hash: replacement.hash,
        cause: new Error(
          replacement.reason === "cancelled"
            ? "The replacement cancelled this transaction."
            : "A different transaction replaced this request.",
        ),
      };
    }
    return { status: "outcome_unknown", hash: currentHash, cause };
  }
}

function fail(
  dependencies: GalleryPurchaseDependencies,
  stage: GalleryPurchaseErrorStage,
  cause: unknown,
): ExecuteGalleryPurchaseResult {
  dependencies.dispatch({ type: "failed", stage, cause });
  return { status: "failed", stage, cause };
}

export async function executeGalleryPurchase(
  request: GalleryPurchaseRequest,
  dependencies: GalleryPurchaseDependencies,
): Promise<ExecuteGalleryPurchaseResult> {
  dependencies.dispatch({ type: "started" });

  let stage: GalleryPurchaseErrorStage = "connection";
  let approvalHash: Hash | null = null;

  try {
    let wallet = await dependencies.getWalletContext();
    if (!wallet.account) {
      return fail(
        dependencies,
        "connection",
        new Error("Connect a wallet to buy with TEST."),
      );
    }

    if (wallet.chainId !== request.targetChainId) {
      stage = "switch_chain";
      dependencies.dispatch({ type: "switching_chain" });
      await dependencies.switchChain(request.targetChainId);
      wallet = await dependencies.getWalletContext();
      if (wallet.chainId !== request.targetChainId || !wallet.account) {
        return fail(dependencies, "switch_chain", contextChangedError());
      }
    }

    const account = wallet.account;
    const recipient = request.recipient ?? account;
    stage = "context";
    const initialSnapshot = await dependencies.captureSnapshot({
      account,
      recipient,
      tokenId: request.tokenId,
      targetChainId: request.targetChainId,
    });
    const frozen = initialSnapshot.fingerprint;
    dependencies.dispatch({ type: "frozen", snapshot: initialSnapshot });

    if (!isAddressEqual(frozen.account, account)) {
      return fail(dependencies, "context", contextChangedError());
    }

    if (initialSnapshot.allowance < frozen.total) {
      stage = "simulation";
      dependencies.dispatch({ type: "simulating", kind: "approval" });
      const preparedApproval = await dependencies.simulateApproval(frozen);
      if (!(await walletContextMatches(dependencies, frozen))) {
        return fail(dependencies, "context", contextChangedError());
      }

      stage = "wallet";
      dependencies.dispatch({ type: "wallet_requested", kind: "approval" });
      approvalHash = await dependencies.writeApproval(preparedApproval, frozen);
      dependencies.dispatch({
        type: "broadcast",
        kind: "approval",
        hash: approvalHash,
      });

      for (let confirmations = 1; confirmations <= 3; confirmations += 1) {
        stage = "receipt";
        const receipt = await waitForKnownReceipt({
          dependencies,
          kind: "approval",
          hash: approvalHash,
          confirmations,
        });
        approvalHash = receipt.hash;
        if (receipt.status === "outcome_unknown") {
          dependencies.dispatch({
            type: "outcome_unknown",
            kind: "approval",
            cause: receipt.cause,
          });
          return {
            status: "outcome_unknown",
            kind: "approval",
            hash: receipt.hash,
            cause: receipt.cause,
          };
        }
        if (receipt.status === "failed") {
          return fail(dependencies, "replacement", receipt.cause);
        }
        dependencies.dispatch({
          type: "approval_confirmed",
          confirmations,
        });

        stage = "context";
        const refreshed = await dependencies.captureSnapshot({
          account: frozen.account,
          recipient: frozen.recipient,
          tokenId: frozen.tokenId,
          targetChainId: frozen.chainId,
        });
        if (!sameGalleryPurchaseFingerprint(frozen, refreshed.fingerprint)) {
          return fail(dependencies, "context", contextChangedError());
        }
        stage = "simulation";
        dependencies.dispatch({ type: "simulating", kind: "fill" });
        try {
          await dependencies.simulateFill(frozen);
          break;
        } catch (cause) {
          if (refreshed.allowance >= frozen.total || confirmations === 3) {
            return fail(dependencies, "simulation", cause);
          }
        }
      }
    }

    stage = "context";
    const preFillSnapshot = await dependencies.captureSnapshot({
      account: frozen.account,
      recipient: frozen.recipient,
      tokenId: frozen.tokenId,
      targetChainId: frozen.chainId,
    });
    if (!sameGalleryPurchaseFingerprint(frozen, preFillSnapshot.fingerprint)) {
      return fail(dependencies, "context", contextChangedError());
    }
    dependencies.dispatch({ type: "pre_fill", snapshot: preFillSnapshot });

    stage = "simulation";
    dependencies.dispatch({ type: "simulating", kind: "fill" });
    const preparedFill = await dependencies.simulateFill(frozen);
    if (!(await walletContextMatches(dependencies, frozen))) {
      return fail(dependencies, "context", contextChangedError());
    }

    stage = "wallet";
    dependencies.dispatch({ type: "wallet_requested", kind: "fill" });
    let fillHash = await dependencies.writeFill(preparedFill, frozen);
    dependencies.dispatch({ type: "broadcast", kind: "fill", hash: fillHash });

    stage = "receipt";
    const fillReceipt = await waitForKnownReceipt({
      dependencies,
      kind: "fill",
      hash: fillHash,
      confirmations: 1,
    });
    fillHash = fillReceipt.hash;
    if (fillReceipt.status === "outcome_unknown") {
      dependencies.dispatch({
        type: "outcome_unknown",
        kind: "fill",
        cause: fillReceipt.cause,
      });
      return {
        status: "outcome_unknown",
        kind: "fill",
        hash: fillHash,
        cause: fillReceipt.cause,
      };
    }
    if (fillReceipt.status === "failed") {
      return fail(dependencies, "replacement", fillReceipt.cause);
    }

    dependencies.dispatch({ type: "fill_receipt_confirmed" });
    return {
      status: "fill_receipt_confirmed",
      approvalHash,
      fillHash,
      fingerprint: frozen,
      preFillSnapshot,
      receipt: fillReceipt.receipt,
    };
  } catch (cause) {
    return fail(dependencies, stage, cause);
  }
}

export function createGalleryPurchaseSubmissionGate() {
  let active = false;
  return {
    async run<T>(operation: () => Promise<T>) {
      if (active) return { status: "blocked" as const };
      active = true;
      try {
        return await operation();
      } finally {
        active = false;
      }
    },
  };
}
