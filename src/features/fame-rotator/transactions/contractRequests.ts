import {
  fameBurnPoolRotatorAbi,
  fameMirrorAbi,
} from "@/wagmi";
import {
  isAddress,
  isAddressEqual,
  type Address,
  type Hash,
} from "viem";
import { base } from "viem/chains";

// ---------------------------------------------------------------------------
// Frozen contexts
// ---------------------------------------------------------------------------

/** Frozen approval intent: account, Base, offered ID, mirror, rotator spender. */
export type FrozenApprovalContext = {
  account: Address;
  chainId: typeof base.id;
  offeredId: bigint;
  mirror: Address;
  rotator: Address;
};

/**
 * Frozen rotation intent: account, Base, target, offered, maxRotations,
 * recipient (always the initiating account), mirror, and rotator.
 */
export type FrozenRotationContext = {
  account: Address;
  chainId: typeof base.id;
  targetId: bigint;
  offeredId: bigint;
  maxRotations: bigint;
  recipient: Address;
  mirror: Address;
  rotator: Address;
};

export type LiveApprovalContext = {
  account: Address;
  chainId: number;
  offeredId: number | bigint;
  mirror: Address;
  rotator: Address;
};

export type LiveRotationContext = {
  account: Address;
  chainId: number;
  targetId: number | bigint;
  offeredId: number | bigint;
  maxRotations: number | bigint;
  recipient: Address;
  mirror: Address;
  rotator: Address;
};

export type FreezeApprovalContextInput = {
  account: Address;
  offeredId: number | bigint;
  mirror: Address;
  rotator: Address;
};

export type FreezeRotationContextInput = {
  account: Address;
  targetId: number | bigint;
  offeredId: number | bigint;
  maxRotations: number | bigint;
  mirror: Address;
  rotator: Address;
  /**
   * Ignored when present. Recipient is always the initiating account
   * (KTD10 / R16) and is not editable in this slice.
   */
  recipient?: Address;
};

export function freezeApprovalContext(
  input: FreezeApprovalContextInput,
): FrozenApprovalContext {
  return {
    account: input.account,
    chainId: base.id,
    offeredId: BigInt(input.offeredId),
    mirror: input.mirror,
    rotator: input.rotator,
  };
}

/**
 * Freeze a rotation context. Recipient is forced to the initiating account
 * regardless of any supplied recipient value.
 */
export function freezeRotationContext(
  input: FreezeRotationContextInput,
): FrozenRotationContext {
  return {
    account: input.account,
    chainId: base.id,
    targetId: BigInt(input.targetId),
    offeredId: BigInt(input.offeredId),
    maxRotations: BigInt(input.maxRotations),
    recipient: input.account,
    mirror: input.mirror,
    rotator: input.rotator,
  };
}

function sameAddress(a: Address, b: Address): boolean {
  return isAddress(a) && isAddress(b) && isAddressEqual(a, b);
}

function sameTokenId(a: bigint, b: number | bigint): boolean {
  return a === BigInt(b);
}

/** True when live values still match the frozen approval intent. */
export function isApprovalContextValid(
  frozen: FrozenApprovalContext,
  live: LiveApprovalContext,
): boolean {
  return (
    frozen.chainId === live.chainId &&
    frozen.chainId === base.id &&
    sameAddress(frozen.account, live.account) &&
    sameTokenId(frozen.offeredId, live.offeredId) &&
    sameAddress(frozen.mirror, live.mirror) &&
    sameAddress(frozen.rotator, live.rotator)
  );
}

/** True when live values still match the frozen rotation intent. */
export function isRotationContextValid(
  frozen: FrozenRotationContext,
  live: LiveRotationContext,
): boolean {
  return (
    frozen.chainId === live.chainId &&
    frozen.chainId === base.id &&
    sameAddress(frozen.account, live.account) &&
    sameTokenId(frozen.targetId, live.targetId) &&
    sameTokenId(frozen.offeredId, live.offeredId) &&
    sameTokenId(frozen.maxRotations, live.maxRotations) &&
    sameAddress(frozen.recipient, live.recipient) &&
    sameAddress(frozen.mirror, live.mirror) &&
    sameAddress(frozen.rotator, live.rotator)
  );
}

// ---------------------------------------------------------------------------
// Request builders
// ---------------------------------------------------------------------------

/** Token-scoped `approve(rotator, offeredId)` on the Society mirror. */
export type FameRotatorApprovalRequest = {
  abi: typeof fameMirrorAbi;
  address: Address;
  account: Address;
  chainId: typeof base.id;
  functionName: "approve";
  args: readonly [spender: Address, tokenId: bigint];
  gas?: bigint;
};

/** `rotateTo(offeredId, targetId, maxRotations, recipient)` on the rotator. */
export type FameRotatorRotationRequest = {
  abi: typeof fameBurnPoolRotatorAbi;
  address: Address;
  account: Address;
  chainId: typeof base.id;
  functionName: "rotateTo";
  args: readonly [
    offeredId: bigint,
    targetId: bigint,
    maxRotations: bigint,
    recipient: Address,
  ];
  gas?: bigint;
};

export type FameRotatorContractRequest =
  | FameRotatorApprovalRequest
  | FameRotatorRotationRequest;

export function buildApprovalRequest(
  context: FrozenApprovalContext,
): FameRotatorApprovalRequest {
  return {
    abi: fameMirrorAbi,
    address: context.mirror,
    account: context.account,
    chainId: base.id,
    functionName: "approve",
    args: [context.rotator, context.offeredId],
  };
}

export function buildRotationRequest(
  context: FrozenRotationContext,
): FameRotatorRotationRequest {
  return {
    abi: fameBurnPoolRotatorAbi,
    address: context.rotator,
    account: context.account,
    chainId: base.id,
    functionName: "rotateTo",
    args: [
      context.offeredId,
      context.targetId,
      context.maxRotations,
      context.recipient,
    ],
  };
}

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------

export type RotatorAuthorizationInput = {
  rotator: Address;
  /** Result of mirror `getApproved(offeredId)`. */
  getApproved: Address | null | undefined;
  /** Result of mirror `isApprovedForAll(owner, rotator)`. */
  isApprovedForAll: boolean | null | undefined;
};

/**
 * True when the rotator already has authority over the offered token via
 * exact token approval or operator approval. Unrelated spenders do not count.
 */
export function isRotatorAuthorizedForOffered({
  rotator,
  getApproved,
  isApprovedForAll,
}: RotatorAuthorizationInput): boolean {
  if (isApprovedForAll === true) {
    return true;
  }
  if (
    typeof getApproved === "string" &&
    isAddress(getApproved) &&
    isAddress(rotator) &&
    isAddressEqual(getApproved, rotator)
  ) {
    return true;
  }
  return false;
}

/** Prefer token-scoped approve; skip only when already authorized. */
export function needsRotatorApproval(
  input: RotatorAuthorizationInput,
): boolean {
  return !isRotatorAuthorizedForOffered(input);
}

// ---------------------------------------------------------------------------
// Fresh FIFO → maxRotations
// ---------------------------------------------------------------------------

export type DerivedMaxRotations =
  | { status: "present"; index: number; maxRotations: number }
  | { status: "absent" };

/**
 * Derive the automatic rotation bound from a fresh ordered FIFO snapshot.
 * `maxRotations = zero-based index + 1`. Target absence blocks preparation.
 */
export function deriveMaxRotationsFromOrderedIds(
  tokenIds: readonly number[],
  targetId: number,
): DerivedMaxRotations {
  const index = tokenIds.indexOf(targetId);
  if (index < 0) {
    return { status: "absent" };
  }
  return { status: "present", index, maxRotations: index + 1 };
}

export type FreezeRotationFromFifoInput = {
  account: Address;
  targetId: number;
  offeredId: number;
  orderedTokenIds: readonly number[];
  mirror: Address;
  rotator: Address;
};

export type FreezeRotationFromFifoResult =
  | {
      status: "ready";
      context: FrozenRotationContext;
      request: FameRotatorRotationRequest;
      index: number;
      maxRotations: number;
    }
  | {
      status: "target_absent";
      targetId: number;
      message: string;
    };

/**
 * Build a frozen rotation context + exact request from a fresh FIFO snapshot.
 * Does not call the network; pass an uncached execution-mode snapshot in.
 */
export function freezeRotationContextFromFifo(
  input: FreezeRotationFromFifoInput,
): FreezeRotationFromFifoResult {
  const derived = deriveMaxRotationsFromOrderedIds(
    input.orderedTokenIds,
    input.targetId,
  );
  if (derived.status === "absent") {
    return {
      status: "target_absent",
      targetId: input.targetId,
      message:
        "The selected target is no longer in the burn pool. Choose another token from /fame.",
    };
  }

  const context = freezeRotationContext({
    account: input.account,
    targetId: input.targetId,
    offeredId: input.offeredId,
    maxRotations: derived.maxRotations,
    mirror: input.mirror,
    rotator: input.rotator,
  });

  return {
    status: "ready",
    context,
    request: buildRotationRequest(context),
    index: derived.index,
    maxRotations: derived.maxRotations,
  };
}

// ---------------------------------------------------------------------------
// Simulation readiness
// ---------------------------------------------------------------------------

export type RotationSimulationBlockReason =
  | "offered_not_owned"
  | "target_absent"
  | "approval_missing"
  | "context_invalid"
  | "identity_incompatible";

export type RotationSimulationReadiness =
  | { ready: true }
  | {
      ready: false;
      reason: RotationSimulationBlockReason;
      message: string;
    };

export type EvaluateRotationSimulationReadinessInput = {
  offeredOwner: Address | null | undefined;
  account: Address;
  targetInPool: boolean;
  authorized: boolean;
  contextValid: boolean;
  identityCompatible: boolean;
};

/**
 * Gate simulation: ownership loss, target disappearance, approval loss,
 * stale context, or incompatible identity all block writes.
 */
export function evaluateRotationSimulationReadiness({
  offeredOwner,
  account,
  targetInPool,
  authorized,
  contextValid,
  identityCompatible,
}: EvaluateRotationSimulationReadinessInput): RotationSimulationReadiness {
  if (!identityCompatible) {
    return {
      ready: false,
      reason: "identity_incompatible",
      message:
        "Your wallet provider is connected to a different rotator environment.",
    };
  }
  if (!contextValid) {
    return {
      ready: false,
      reason: "context_invalid",
      message:
        "Account, chain, target, or offered token changed. Prepare the rotation again.",
    };
  }
  if (
    typeof offeredOwner !== "string" ||
    !isAddress(offeredOwner) ||
    !isAddress(account) ||
    !isAddressEqual(offeredOwner, account)
  ) {
    return {
      ready: false,
      reason: "offered_not_owned",
      message:
        "You no longer own the offered Society NFT. Select a different token.",
    };
  }
  if (!targetInPool) {
    return {
      ready: false,
      reason: "target_absent",
      message:
        "The selected target is no longer in the burn pool. Choose another token from /fame.",
    };
  }
  if (!authorized) {
    return {
      ready: false,
      reason: "approval_missing",
      message:
        "The rotator is not authorized for the offered NFT. Approve it again.",
    };
  }
  return { ready: true };
}

// ---------------------------------------------------------------------------
// Exact simulated-request write path
// ---------------------------------------------------------------------------

export type SimulateThenWriteDependencies<TRequest, THash = Hash> = {
  simulate: (request: TRequest) => Promise<TRequest>;
  write: (request: TRequest) => Promise<THash>;
};

/**
 * Simulate, then write the **exact** request object returned by simulation.
 * The write layer must not rebuild args from frozen context after simulate.
 */
export async function simulateThenWriteExactRequest<TRequest, THash = Hash>(
  request: TRequest,
  dependencies: SimulateThenWriteDependencies<TRequest, THash>,
): Promise<{ hash: THash; simulatedRequest: TRequest }> {
  const simulatedRequest = await dependencies.simulate(request);
  const hash = await dependencies.write(simulatedRequest);
  return { hash, simulatedRequest };
}

// ---------------------------------------------------------------------------
// Error classification (request / simulation surface)
// ---------------------------------------------------------------------------

export type RotatorRequestErrorKind =
  | "recipient_incompatible"
  | "target_not_reached"
  | "contract_reverted"
  | "unknown";

export type RotatorRequestError = {
  kind: RotatorRequestErrorKind;
  message: string;
};

const RECIPIENT_ERROR_NAMES = new Set([
  "ERC721InvalidReceiver",
  "TransferToNonERC721ReceiverImplementer",
  "TransferToZeroAddress",
  "ERC721ReceiverRejectedTokens",
]);

function errorChain(error: unknown): unknown[] {
  const chain: unknown[] = [];
  let current: unknown = error;
  const seen = new Set<unknown>();
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    chain.push(current);
    const record = current as {
      cause?: unknown;
      walk?: unknown;
    };
    current = record.cause ?? null;
  }
  return chain;
}

function contractErrorName(error: unknown): string | null {
  for (const candidate of errorChain(error)) {
    if (!candidate || typeof candidate !== "object") continue;
    const record = candidate as {
      errorName?: unknown;
      data?: unknown;
      shortMessage?: unknown;
      message?: unknown;
      name?: unknown;
    };
    if (typeof record.errorName === "string" && record.errorName.length > 0) {
      return record.errorName;
    }
    if (record.data && typeof record.data === "object") {
      const data = record.data as { errorName?: unknown };
      if (typeof data.errorName === "string" && data.errorName.length > 0) {
        return data.errorName;
      }
    }
  }
  return null;
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Classify simulation / contract failures at the request layer.
 * Receiver rejection is a recipient compatibility failure (R20 / U5).
 */
export function classifyRotatorRequestError(
  error: unknown,
): RotatorRequestError {
  const name = contractErrorName(error);
  if (name === "TargetNotReached") {
    return {
      kind: "target_not_reached",
      message:
        "The target was not reached within the frozen rotation bound. The burn pool may have reordered — refresh and try again.",
    };
  }
  if (name && RECIPIENT_ERROR_NAMES.has(name)) {
    return {
      kind: "recipient_incompatible",
      message:
        "The recipient cannot receive this Society NFT. The rotation recipient is your connected account; check wallet compatibility.",
    };
  }

  const text = errorText(error).toLowerCase();
  if (
    text.includes("invalidreceiver") ||
    text.includes("non erc721receiver") ||
    text.includes("transfer to non-erc721receiver") ||
    text.includes("erc721receiver")
  ) {
    return {
      kind: "recipient_incompatible",
      message:
        "The recipient cannot receive this Society NFT. The rotation recipient is your connected account; check wallet compatibility.",
    };
  }

  if (
    name ||
    /execution reverted|contract function .*reverted|reverted with/i.test(
      errorText(error),
    )
  ) {
    return {
      kind: "contract_reverted",
      message: "The rotator contract rejected this request.",
    };
  }

  return {
    kind: "unknown",
    message: "The rotation request could not be prepared.",
  };
}
