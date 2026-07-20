"use client";

import { useCallback, useReducer, useRef } from "react";
import {
  encodeFunctionData,
  isAddress,
  isAddressEqual,
  type Address,
  type Hash,
  type Hex,
  type PublicClient,
} from "viem";
import type { ReplacementReason } from "viem/actions";
import { base } from "viem/chains";
import { usePublicClient, useWriteContract } from "wagmi";
import { getOrderedBurnPoolTokenIds } from "@/service/fame";
import { fameBurnPoolRotatorAbi, fameMirrorAbi } from "@/wagmi";
import {
  getFameRotatorConfig,
} from "../config";
import {
  classifyRotatorTransactionError,
  createRotatorSubmissionGate,
  initialRotatorTransactionState,
  minedTransactionMatchesFrozenIntent,
  projectRotationOwnershipProof,
  rotatorTransactionReducer,
  type RotatorErrorStage,
  type RotatorFrozenIntent,
  type RotatorTransactionError,
  type RotatorTransactionEvent,
  type RotatorTransactionState,
} from "../transactionState";
import {
  buildApprovalRequest,
  freezeApprovalContext,
  freezeRotationContextFromFifo,
  isRotatorAuthorizedForOffered,
  type FameRotatorApprovalRequest,
  type FameRotatorContractRequest,
  type FameRotatorRotationRequest,
} from "../transactions/contractRequests";

// ---------------------------------------------------------------------------
// Pure execution surface (unit-testable, auction-shaped)
// ---------------------------------------------------------------------------

export type RotatorReplacement = {
  reason: ReplacementReason;
  hash: Hash;
};

export type RotatorMinedReceipt = {
  status: "success" | "reverted";
  blockNumber: bigint;
  transactionHash: Hash;
};

export type RotatorMinedTransaction = {
  from: Address;
  to: Address | null;
  value: bigint;
  input: Hex;
};

export interface ExecuteRotatorTransactionDependencies {
  dispatch: (event: RotatorTransactionEvent) => void;
  simulate: (
    request: FameRotatorContractRequest,
  ) => Promise<FameRotatorContractRequest>;
  write: (request: FameRotatorContractRequest) => Promise<Hash>;
  wait: (
    hash: Hash,
    onReplaced: (replacement: RotatorReplacement) => void,
  ) => Promise<RotatorMinedReceipt>;
  /** Fetch the effective mined transaction for identity comparison. */
  getTransaction: (hash: Hash) => Promise<RotatorMinedTransaction>;
  expectedInput: Hex;
  frozenIntent: RotatorFrozenIntent;
  /**
   * After a successful approval receipt: re-read ownership + authorization.
   * Return true only when the initiating account still owns the NFT and the
   * rotator is authorized.
   */
  confirmApprovalAuthorization?: () => Promise<boolean>;
  /**
   * After a successful rotation receipt: read ownerAt at the receipt block.
   * Null owners mean historical read failure → verification_pending.
   */
  readRotationOwnershipAtBlock?: (blockNumber: bigint) => Promise<{
    targetOwner: Address | null;
    offeredOwner: Address | null;
  }>;
  /** After verified ownership proof, refresh latest pool / inventory. */
  refreshLatest?: () => Promise<void>;
}

export type ExecuteRotatorTransactionResult =
  | {
      status: "verified";
      hash: Hash;
      replacement: RotatorReplacement | null;
    }
  | {
      status: "verification_pending";
      hash: Hash;
      blockNumber: bigint;
    }
  | {
      status: "refresh_failed_after_verified";
      hash: Hash;
    }
  | { status: "different_transaction"; hash: Hash | null }
  | { status: "cancelled" }
  | { status: "failed"; error: RotatorTransactionError };

function receiptRevertedError(): RotatorTransactionError {
  return {
    kind: "receipt_reverted",
    message:
      "The transaction reverted onchain. Your offered NFT should still be yours — refresh the pool and try again.",
    retryable: true,
    shouldRefresh: true,
  };
}

function ownershipMismatchError(): RotatorTransactionError {
  return {
    kind: "ownership_mismatch",
    message:
      "The transaction mined, but ownership does not match the requested exchange. Check the explorer before trying again.",
    retryable: false,
    shouldRefresh: true,
    blockRetryWrite: true,
  };
}

function approvalNotConfirmedError(): RotatorTransactionError {
  return {
    kind: "contract_reverted",
    message:
      "Approval mined, but the rotator is still not authorized for this NFT. Try approving again.",
    retryable: true,
    shouldRefresh: true,
  };
}

/**
 * Simulate → write exact request → wait with replacement handling →
 * ownership / authorization proof. Approval and rotation share one pipeline;
 * proof steps branch on frozen intent action.
 */
export async function executeRotatorTransaction(
  request: FameRotatorContractRequest,
  dependencies: ExecuteRotatorTransactionDependencies,
): Promise<ExecuteRotatorTransactionResult> {
  const action = dependencies.frozenIntent.action;
  let stage: RotatorErrorStage = "simulation";
  const replacement: { current: RotatorReplacement | null } = {
    current: null,
  };

  dependencies.dispatch({
    type: "started",
    action,
    frozenIntent: dependencies.frozenIntent,
  });

  try {
    const simulatedRequest = await dependencies.simulate(request);
    stage = "wallet";
    dependencies.dispatch({ type: "wallet_requested" });
    const hash = await dependencies.write(simulatedRequest);
    dependencies.dispatch({ type: "broadcast", hash });

    stage = "receipt";
    const receipt = await dependencies.wait(hash, (nextReplacement) => {
      replacement.current = nextReplacement;
      if (nextReplacement.reason === "cancelled") {
        // Terminal handling after wait returns.
        return;
      }
      // Repriced (identical-intent) and same-nonce replacements update the
      // effective hash; semantic differences are classified after mining.
      dependencies.dispatch({
        type: "replaced",
        reason: nextReplacement.reason,
        hash: nextReplacement.hash,
      });
    });

    if (replacement.current?.reason === "cancelled") {
      dependencies.dispatch({ type: "cancelled" });
      return { status: "cancelled" };
    }

    const effectiveHash =
      replacement.current?.hash ?? receipt.transactionHash ?? hash;

    // Effective mined transaction must match frozen sender/destination/calldata.
    const minedTx = await dependencies.getTransaction(effectiveHash);
    const matches = minedTransactionMatchesFrozenIntent({
      from: minedTx.from,
      to: minedTx.to,
      value: minedTx.value,
      input: minedTx.input,
      frozen: dependencies.frozenIntent,
      expectedInput: dependencies.expectedInput,
    });
    if (!matches) {
      dependencies.dispatch({
        type: "different_transaction",
        hash: effectiveHash,
      });
      return { status: "different_transaction", hash: effectiveHash };
    }

    if (receipt.status === "reverted") {
      const error = receiptRevertedError();
      dependencies.dispatch({ type: "reverted", error });
      return { status: "failed", error };
    }

    dependencies.dispatch({
      type: "mined",
      hash: effectiveHash,
      blockNumber: receipt.blockNumber,
    });

    stage = "verification";

    if (action === "approve") {
      const authorized =
        (await dependencies.confirmApprovalAuthorization?.()) ?? true;
      if (!authorized) {
        const error = approvalNotConfirmedError();
        dependencies.dispatch({ type: "failed", error });
        return { status: "failed", error };
      }
      dependencies.dispatch({ type: "verified" });
      // Discard prior rotation prep and re-read ownership after approval proof.
      if (dependencies.refreshLatest) {
        try {
          await dependencies.refreshLatest();
        } catch (cause) {
          const error = classifyRotatorTransactionError(cause, "refresh");
          dependencies.dispatch({
            type: "refresh_failed_after_verified",
            error,
          });
          return {
            status: "refresh_failed_after_verified",
            hash: effectiveHash,
          };
        }
      }
      return {
        status: "verified",
        hash: effectiveHash,
        replacement: replacement.current,
      };
    }

    // Rotation: receipt-block ownership proof is the sole success authority.
    const ownership = await dependencies.readRotationOwnershipAtBlock?.(
      receipt.blockNumber,
    );
    const recipient = dependencies.frozenIntent.recipient;
    if (!ownership || !recipient) {
      dependencies.dispatch({ type: "verification_pending" });
      return {
        status: "verification_pending",
        hash: effectiveHash,
        blockNumber: receipt.blockNumber,
      };
    }

    const proof = projectRotationOwnershipProof({
      targetOwner: ownership.targetOwner,
      offeredOwner: ownership.offeredOwner,
      recipient,
    });

    if (proof.status === "pending_reads") {
      dependencies.dispatch({ type: "verification_pending" });
      return {
        status: "verification_pending",
        hash: effectiveHash,
        blockNumber: receipt.blockNumber,
      };
    }

    if (proof.status === "mismatch") {
      const error = ownershipMismatchError();
      dependencies.dispatch({ type: "failed", error });
      return { status: "failed", error };
    }

    dependencies.dispatch({ type: "verified" });

    // Latest refresh failure must never undo verified ownership proof.
    stage = "refresh";
    if (dependencies.refreshLatest) {
      try {
        await dependencies.refreshLatest();
      } catch (cause) {
        const error = classifyRotatorTransactionError(cause, "refresh");
        dependencies.dispatch({
          type: "refresh_failed_after_verified",
          error,
        });
        return {
          status: "refresh_failed_after_verified",
          hash: effectiveHash,
        };
      }
    }

    return {
      status: "verified",
      hash: effectiveHash,
      replacement: replacement.current,
    };
  } catch (cause) {
    const error = classifyRotatorTransactionError(cause, stage);
    if (error.kind === "target_not_reached") {
      dependencies.dispatch({ type: "reverted", error });
    } else {
      dependencies.dispatch({ type: "failed", error });
    }
    return { status: "failed", error };
  }
}

// ---------------------------------------------------------------------------
// Authorization / ownership helpers (client public client)
// ---------------------------------------------------------------------------

export async function readOfferedOwnershipAndAuthorization(
  client: PublicClient,
  {
    mirror,
    rotator,
    account,
    offeredId,
  }: {
    mirror: Address;
    rotator: Address;
    account: Address;
    offeredId: bigint;
  },
): Promise<{
  owned: boolean;
  authorized: boolean;
  owner: Address | null;
}> {
  const [owner, getApproved, isApprovedForAll] = await Promise.all([
    client.readContract({
      address: mirror,
      abi: fameMirrorAbi,
      functionName: "ownerAt",
      args: [offeredId],
    }),
    client.readContract({
      address: mirror,
      abi: fameMirrorAbi,
      functionName: "getApproved",
      args: [offeredId],
    }),
    client.readContract({
      address: mirror,
      abi: fameMirrorAbi,
      functionName: "isApprovedForAll",
      args: [account, rotator],
    }),
  ]);

  const owned =
    typeof owner === "string" &&
    isAddress(owner) &&
    isAddressEqual(owner, account);

  const authorized = isRotatorAuthorizedForOffered({
    rotator,
    getApproved: typeof getApproved === "string" ? getApproved : null,
    isApprovedForAll:
      typeof isApprovedForAll === "boolean" ? isApprovedForAll : null,
  });

  return {
    owned,
    authorized,
    owner: typeof owner === "string" && isAddress(owner) ? owner : null,
  };
}

export async function readRotationOwnershipAtBlock(
  client: PublicClient,
  {
    mirror,
    targetId,
    offeredId,
    blockNumber,
  }: {
    mirror: Address;
    targetId: bigint;
    offeredId: bigint;
    blockNumber: bigint;
  },
): Promise<{ targetOwner: Address | null; offeredOwner: Address | null }> {
  try {
    const [targetOwner, offeredOwner] = await Promise.all([
      client.readContract({
        address: mirror,
        abi: fameMirrorAbi,
        functionName: "ownerAt",
        args: [targetId],
        blockNumber,
      }),
      client.readContract({
        address: mirror,
        abi: fameMirrorAbi,
        functionName: "ownerAt",
        args: [offeredId],
        blockNumber,
      }),
    ]);

    return {
      targetOwner:
        typeof targetOwner === "string" && isAddress(targetOwner)
          ? targetOwner
          : null,
      offeredOwner:
        typeof offeredOwner === "string" && isAddress(offeredOwner)
          ? offeredOwner
          : null,
    };
  } catch {
    return { targetOwner: null, offeredOwner: null };
  }
}

function encodeApprovalCalldata(
  rotator: Address,
  offeredId: bigint,
): Hex {
  return encodeFunctionData({
    abi: fameMirrorAbi,
    functionName: "approve",
    args: [rotator, offeredId],
  });
}

function encodeRotationCalldata(
  context: {
    offeredId: bigint;
    targetId: bigint;
    maxRotations: bigint;
    recipient: Address;
  },
): Hex {
  return encodeFunctionData({
    abi: fameBurnPoolRotatorAbi,
    functionName: "rotateTo",
    args: [
      context.offeredId,
      context.targetId,
      context.maxRotations,
      context.recipient,
    ],
  });
}

function environmentChangedError(): RotatorTransactionError {
  return {
    kind: "environment_changed",
    message:
      "Your wallet rotator environment changed. Check it and try again.",
    retryable: true,
    shouldRefresh: false,
  };
}

function staleContextError(message: string): RotatorTransactionError {
  return {
    kind: "stale_context",
    message,
    retryable: true,
    shouldRefresh: true,
  };
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export interface PendingRotationProof {
  hash: Hash;
  blockNumber: bigint;
  targetId: bigint;
  offeredId: bigint;
  recipient: Address;
  mirror: Address;
}

export interface UseFameRotatorTransactionInput {
  account: Address | undefined;
  executionReady: boolean;
  verifyEnvironment: () => Promise<boolean>;
  /**
   * After approval verified or rotation terminal states that need inventory /
   * pool refresh. Does not assert eligibility.
   */
  refresh: () => Promise<void>;
  /** Discard any prior rotation prepared state after approval success. */
  onApprovalVerified?: () => void;
}

export interface UseFameRotatorTransactionResult {
  state: RotatorTransactionState;
  isPending: boolean;
  /** Last verification-pending context for retry without a new write. */
  pendingProof: PendingRotationProof | null;
  approve: (
    offeredId: number,
  ) => Promise<ExecuteRotatorTransactionResult | { status: "blocked" }>;
  rotate: (
    targetId: number,
    offeredId: number,
  ) => Promise<ExecuteRotatorTransactionResult | { status: "blocked" }>;
  /**
   * Retry receipt-block ownership proof without broadcasting another write.
   * Only meaningful when state is verification_pending.
   */
  retryVerification: () => Promise<
    | { status: "verified"; hash: Hash }
    | { status: "verification_pending"; hash: Hash; blockNumber: bigint }
    | { status: "failed"; error: RotatorTransactionError }
    | { status: "blocked" }
  >;
  reset: () => void;
}

function isWritePending(status: RotatorTransactionState["status"]): boolean {
  return (
    status === "simulating" ||
    status === "awaiting_wallet" ||
    status === "broadcast" ||
    status === "confirming" ||
    status === "mined_pending_proof"
  );
}

/**
 * Replacement-aware approval and rotation writes with one submission gate.
 * Monitors receipts through a frozen Base public client even if the wallet
 * connection changes after broadcast.
 */
export function useFameRotatorTransaction({
  account,
  executionReady,
  verifyEnvironment,
  refresh,
  onApprovalVerified,
}: UseFameRotatorTransactionInput): UseFameRotatorTransactionResult {
  const publicClient = usePublicClient({ chainId: base.id });
  const { writeContractAsync } = useWriteContract();
  const [state, dispatch] = useReducer(
    rotatorTransactionReducer,
    initialRotatorTransactionState,
  );
  const gate = useRef(createRotatorSubmissionGate());
  const pendingProofRef = useRef<PendingRotationProof | null>(null);
  // Freeze the public client used for post-broadcast monitoring so wallet
  // chain/account drift cannot rebind the wait/getTransaction transport.
  const frozenClientRef = useRef<PublicClient | null>(null);

  const buildWaitAndGet = useCallback((client: PublicClient) => {
    return {
      wait: async (
        hash: Hash,
        onReplaced: (replacement: RotatorReplacement) => void,
      ): Promise<RotatorMinedReceipt> => {
        const receipt = await client.waitForTransactionReceipt({
          hash,
          onReplaced: ({ reason, transaction }) => {
            onReplaced({ reason, hash: transaction.hash });
          },
        });
        return {
          status: receipt.status === "success" ? "success" : "reverted",
          blockNumber: receipt.blockNumber,
          transactionHash: receipt.transactionHash,
        };
      },
      getTransaction: async (hash: Hash): Promise<RotatorMinedTransaction> => {
        const tx = await client.getTransaction({ hash });
        return {
          from: tx.from,
          to: tx.to ?? null,
          value: tx.value,
          input: tx.input,
        };
      },
    };
  }, []);

  const simulateExact = useCallback(
    async (
      client: PublicClient,
      exactRequest: FameRotatorContractRequest,
    ): Promise<FameRotatorContractRequest> => {
      if (exactRequest.functionName === "approve") {
        const approval = exactRequest as FameRotatorApprovalRequest;
        const { request: simulated } = await client.simulateContract({
          address: approval.address,
          abi: approval.abi,
          functionName: "approve",
          args: approval.args,
          account: approval.account,
          chain: base,
        });
        if (typeof simulated.gas === "bigint") {
          return { ...approval, gas: simulated.gas };
        }
        return approval;
      }

      const rotation = exactRequest as FameRotatorRotationRequest;
      const { request: simulated } = await client.simulateContract({
        address: rotation.address,
        abi: rotation.abi,
        functionName: "rotateTo",
        args: rotation.args,
        account: rotation.account,
        chain: base,
      });
      if (typeof simulated.gas === "bigint") {
        return { ...rotation, gas: simulated.gas };
      }
      return rotation;
    },
    [],
  );

  const writeExact = useCallback(
    async (simulatedRequest: FameRotatorContractRequest): Promise<Hash> => {
      if (simulatedRequest.functionName === "approve") {
        return writeContractAsync({
          address: simulatedRequest.address,
          abi: simulatedRequest.abi,
          functionName: "approve",
          args: simulatedRequest.args,
          account: simulatedRequest.account,
          chainId: base.id,
          ...(typeof simulatedRequest.gas === "bigint"
            ? { gas: simulatedRequest.gas }
            : {}),
        });
      }
      return writeContractAsync({
        address: simulatedRequest.address,
        abi: simulatedRequest.abi,
        functionName: "rotateTo",
        args: simulatedRequest.args,
        account: simulatedRequest.account,
        chainId: base.id,
        ...(typeof simulatedRequest.gas === "bigint"
          ? { gas: simulatedRequest.gas }
          : {}),
      });
    },
    [writeContractAsync],
  );

  const approve = useCallback(
    async (offeredId: number) => {
      const config = getFameRotatorConfig(base.id);
      if (
        !executionReady ||
        !account ||
        !publicClient ||
        config.status !== "configured"
      ) {
        return { status: "blocked" as const };
      }

      const client = publicClient;
      frozenClientRef.current = client;

      const gated = await gate.current.run(async () => {
        const verified = await verifyEnvironment();
        if (!verified) {
          const error = environmentChangedError();
          dispatch({ type: "failed", error });
          return { status: "failed" as const, error };
        }

        const context = freezeApprovalContext({
          account,
          offeredId,
          mirror: config.expectedMirror,
          rotator: config.address,
        });
        const request = buildApprovalRequest(context);
        const expectedInput = encodeApprovalCalldata(
          context.rotator,
          context.offeredId,
        );
        const frozenIntent: RotatorFrozenIntent = {
          action: "approve",
          account: context.account,
          chainId: context.chainId,
          targetId: null,
          offeredId: context.offeredId,
          maxRotations: null,
          recipient: null,
          rotator: context.rotator,
          mirror: context.mirror,
          callDataFingerprint: expectedInput,
        };

        const { wait, getTransaction } = buildWaitAndGet(client);

        const result = await executeRotatorTransaction(request, {
          dispatch,
          simulate: (exact) => simulateExact(client, exact),
          write: writeExact,
          wait,
          getTransaction,
          expectedInput,
          frozenIntent,
          confirmApprovalAuthorization: async () => {
            const auth = await readOfferedOwnershipAndAuthorization(client, {
              mirror: context.mirror,
              rotator: context.rotator,
              account: context.account,
              offeredId: context.offeredId,
            });
            return auth.owned && auth.authorized;
          },
          // Discard prior rotation prep after approval proof; refresh inventory.
          refreshLatest: async () => {
            onApprovalVerified?.();
            await refresh();
          },
        });

        return result;
      });

      return gated.accepted ? gated.value : { status: "blocked" as const };
    },
    [
      account,
      buildWaitAndGet,
      executionReady,
      onApprovalVerified,
      publicClient,
      refresh,
      simulateExact,
      verifyEnvironment,
      writeExact,
    ],
  );

  const rotate = useCallback(
    async (targetId: number, offeredId: number) => {
      const config = getFameRotatorConfig(base.id);
      if (
        !executionReady ||
        !account ||
        !publicClient ||
        config.status !== "configured"
      ) {
        return { status: "blocked" as const };
      }

      const client = publicClient;
      frozenClientRef.current = client;

      const gated = await gate.current.run(async () => {
        const verified = await verifyEnvironment();
        if (!verified) {
          const error = environmentChangedError();
          dispatch({ type: "failed", error });
          return { status: "failed" as const, error };
        }

        // Uncached FIFO is the sole membership/bound authority (KTD14 / R15).
        let orderedTokenIds: number[];
        try {
          const snapshot = await getOrderedBurnPoolTokenIds({
            cache: "execution",
          });
          orderedTokenIds = snapshot.tokenIds;
        } catch (cause) {
          const error = classifyRotatorTransactionError(cause, "simulation");
          dispatch({ type: "failed", error });
          return { status: "failed" as const, error };
        }

        const frozen = freezeRotationContextFromFifo({
          account,
          targetId,
          offeredId,
          orderedTokenIds,
          mirror: config.expectedMirror,
          rotator: config.address,
        });

        if (frozen.status === "target_absent") {
          const error = staleContextError(frozen.message);
          dispatch({ type: "failed", error });
          return { status: "failed" as const, error };
        }

        // Re-check offered ownership and rotator authorization before simulate.
        let auth: {
          owned: boolean;
          authorized: boolean;
        };
        try {
          auth = await readOfferedOwnershipAndAuthorization(client, {
            mirror: frozen.context.mirror,
            rotator: frozen.context.rotator,
            account: frozen.context.account,
            offeredId: frozen.context.offeredId,
          });
        } catch (cause) {
          const error = classifyRotatorTransactionError(cause, "simulation");
          dispatch({ type: "failed", error });
          return { status: "failed" as const, error };
        }

        if (!auth.owned) {
          const error = staleContextError(
            "You no longer own the offered Society NFT. Select a different token.",
          );
          dispatch({ type: "failed", error });
          return { status: "failed" as const, error };
        }
        if (!auth.authorized) {
          const error = staleContextError(
            "The rotator is not authorized for the offered NFT. Approve it again.",
          );
          dispatch({ type: "failed", error });
          return { status: "failed" as const, error };
        }

        const expectedInput = encodeRotationCalldata(frozen.context);
        const frozenIntent: RotatorFrozenIntent = {
          action: "rotate",
          account: frozen.context.account,
          chainId: frozen.context.chainId,
          targetId: frozen.context.targetId,
          offeredId: frozen.context.offeredId,
          maxRotations: frozen.context.maxRotations,
          recipient: frozen.context.recipient,
          rotator: frozen.context.rotator,
          mirror: frozen.context.mirror,
          callDataFingerprint: expectedInput,
        };

        const { wait, getTransaction } = buildWaitAndGet(client);

        const result = await executeRotatorTransaction(frozen.request, {
          dispatch,
          simulate: (exact) => simulateExact(client, exact),
          write: writeExact,
          wait,
          getTransaction,
          expectedInput,
          frozenIntent,
          readRotationOwnershipAtBlock: (blockNumber) =>
            readRotationOwnershipAtBlock(client, {
              mirror: frozen.context.mirror,
              targetId: frozen.context.targetId,
              offeredId: frozen.context.offeredId,
              blockNumber,
            }),
          refreshLatest: refresh,
        });

        if (result.status === "verification_pending") {
          pendingProofRef.current = {
            hash: result.hash,
            blockNumber: result.blockNumber,
            targetId: frozen.context.targetId,
            offeredId: frozen.context.offeredId,
            recipient: frozen.context.recipient,
            mirror: frozen.context.mirror,
          };
        } else if (result.status === "verified") {
          pendingProofRef.current = null;
        }

        return result;
      });

      return gated.accepted ? gated.value : { status: "blocked" as const };
    },
    [
      account,
      buildWaitAndGet,
      executionReady,
      publicClient,
      refresh,
      simulateExact,
      verifyEnvironment,
      writeExact,
    ],
  );

  const retryVerification = useCallback(async () => {
    const pending = pendingProofRef.current;
    const client = frozenClientRef.current ?? publicClient;
    if (!pending || !client) {
      return { status: "blocked" as const };
    }

    try {
      const ownership = await readRotationOwnershipAtBlock(client, {
        mirror: pending.mirror,
        targetId: pending.targetId,
        offeredId: pending.offeredId,
        blockNumber: pending.blockNumber,
      });
      const proof = projectRotationOwnershipProof({
        targetOwner: ownership.targetOwner,
        offeredOwner: ownership.offeredOwner,
        recipient: pending.recipient,
      });

      if (proof.status === "pending_reads") {
        dispatch({ type: "verification_pending" });
        return {
          status: "verification_pending" as const,
          hash: pending.hash,
          blockNumber: pending.blockNumber,
        };
      }

      if (proof.status === "mismatch") {
        const error = ownershipMismatchError();
        dispatch({ type: "failed", error });
        pendingProofRef.current = null;
        return { status: "failed" as const, error };
      }

      dispatch({ type: "verified" });
      pendingProofRef.current = null;
      try {
        await refresh();
      } catch (cause) {
        const error = classifyRotatorTransactionError(cause, "refresh");
        dispatch({ type: "refresh_failed_after_verified", error });
      }
      return { status: "verified" as const, hash: pending.hash };
    } catch (cause) {
      const error = classifyRotatorTransactionError(cause, "verification");
      dispatch({ type: "verification_pending" });
      return {
        status: "verification_pending" as const,
        hash: pending.hash,
        blockNumber: pending.blockNumber,
      };
    }
  }, [publicClient, refresh]);

  const reset = useCallback(() => {
    pendingProofRef.current = null;
    dispatch({ type: "reset" });
  }, []);

  return {
    state,
    // Gate pending is mirrored by non-idle reducer statuses during a run.
    isPending: isWritePending(state.status),
    pendingProof: pendingProofRef.current,
    approve,
    rotate,
    retryVerification,
    reset,
  };
}
