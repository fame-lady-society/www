import {
  isAddressEqual,
  maxUint256,
  parseUnits,
  type Address,
  type Hash,
} from "viem";
import type { ReplacementReason } from "viem/actions";

const UINT96_MAX = (1n << 96n) - 1n;
const MAX_INPUT_LENGTH = 80;

export function parseUnsignedTestAmount(
  value: string,
  {
    allowZero,
    maximum = maxUint256,
  }: { allowZero: boolean; maximum?: bigint },
) {
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > MAX_INPUT_LENGTH ||
    !/^\d+(?:\.\d+)?$/.test(normalized)
  ) {
    throw new Error("Enter a plain unsigned TEST amount.");
  }
  const fraction = normalized.split(".")[1] ?? "";
  if (fraction.length > 18) {
    throw new Error("TEST amounts support at most 18 decimal places.");
  }
  const parsed = parseUnits(normalized, 18);
  if ((!allowZero && parsed === 0n) || parsed > maximum) {
    throw new Error("TEST amount is outside the supported range.");
  }
  return parsed;
}

export function parseGalleryPremium(value: string) {
  return parseUnsignedTestAmount(value, {
    allowZero: false,
    maximum: UINT96_MAX,
  });
}

export function parseGalleryTokenId(value: string) {
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > MAX_INPUT_LENGTH ||
    !/^\d+$/.test(normalized)
  ) {
    throw new Error("Token ID must be a plain decimal integer.");
  }
  const tokenId = BigInt(normalized);
  if (tokenId < 1n || tokenId > 888n) {
    throw new Error("Token ID must be between 1 and 888.");
  }
  return tokenId;
}

export function parseGalleryRendererSeed(value: string) {
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > 78 ||
    !/^\d+$/.test(normalized)
  ) {
    throw new Error("Renderer seed must be a uint256 decimal integer.");
  }
  const seed = BigInt(normalized);
  if (seed > maxUint256) {
    throw new Error("Renderer seed exceeds uint256.");
  }
  return seed;
}

export type GalleryAdminCall =
  | { kind: "list"; tokenId: bigint; premium: bigint }
  | { kind: "set_premium"; tokenId: bigint; premium: bigint }
  | { kind: "unlist"; tokenId: bigint }
  | { kind: "rotate_mint"; tokenId: bigint; poolTokenId: bigint }
  | { kind: "rotate_burn"; tokenId: bigint; poolTokenId: bigint }
  | { kind: "rotate_end_of_mint"; tokenId: bigint; metadataUri: string }
  | { kind: "withdraw_fees"; recipient: Address; amount: bigint };

export type GalleryAdminStatus =
  | "idle"
  | "switching_chain"
  | "simulating"
  | "awaiting_wallet"
  | "confirming"
  | "confirmed"
  | "outcome_unknown"
  | "error";

export type GalleryAdminState = {
  status: GalleryAdminStatus;
  call: GalleryAdminCall | null;
  hash: Hash | null;
  failure: { stage: string; cause: unknown } | null;
};

export const initialGalleryAdminState: GalleryAdminState = {
  status: "idle",
  call: null,
  hash: null,
  failure: null,
};

export type GalleryAdminEvent =
  | { type: "started"; call: GalleryAdminCall }
  | { type: "switching_chain" }
  | { type: "simulating" }
  | { type: "wallet_requested" }
  | { type: "broadcast"; hash: Hash }
  | { type: "replacement"; reason: ReplacementReason; hash: Hash }
  | { type: "confirmed" }
  | { type: "outcome_unknown"; cause: unknown }
  | { type: "failed"; stage: string; cause: unknown }
  | { type: "reset" };

export function galleryAdminReducer(
  state: GalleryAdminState,
  event: GalleryAdminEvent,
): GalleryAdminState {
  switch (event.type) {
    case "started":
      return {
        ...initialGalleryAdminState,
        status: "simulating",
        call: event.call,
      };
    case "switching_chain":
      return { ...state, status: "switching_chain" };
    case "simulating":
      return { ...state, status: "simulating", failure: null };
    case "wallet_requested":
      return { ...state, status: "awaiting_wallet" };
    case "broadcast":
      return { ...state, status: "confirming", hash: event.hash };
    case "replacement":
      return { ...state, status: "confirming", hash: event.hash };
    case "confirmed":
      return { ...state, status: "confirmed", failure: null };
    case "outcome_unknown":
      return {
        ...state,
        status: "outcome_unknown",
        failure: { stage: "receipt", cause: event.cause },
      };
    case "failed":
      return {
        ...state,
        status: "error",
        failure: { stage: event.stage, cause: event.cause },
      };
    case "reset":
      return initialGalleryAdminState;
  }
}

export type GalleryAdminDependencies = {
  dispatch: (event: GalleryAdminEvent) => void;
  getWalletContext: () =>
    | { account: Address | null; chainId: number | undefined }
    | Promise<{ account: Address | null; chainId: number | undefined }>;
  switchChain: (chainId: number) => Promise<unknown>;
  simulate: (call: GalleryAdminCall, account: Address) => Promise<unknown>;
  write: (
    prepared: unknown,
    call: GalleryAdminCall,
    account: Address,
  ) => Promise<Hash>;
  waitForReceipt: (input: {
    hash: Hash;
    onReplaced: (replacement: {
      reason: ReplacementReason;
      hash: Hash;
    }) => void;
  }) => Promise<{ status: "success" | "reverted" }>;
  refresh: (call: GalleryAdminCall) => Promise<void>;
};

export type GalleryAdminResult =
  | { status: "confirmed"; hash: Hash }
  | { status: "outcome_unknown"; hash: Hash; cause: unknown }
  | { status: "failed"; stage: string; cause: unknown };

export async function executeGalleryAdminAction(
  call: GalleryAdminCall,
  targetChainId: number,
  dependencies: GalleryAdminDependencies,
): Promise<GalleryAdminResult> {
  dependencies.dispatch({ type: "started", call });
  let stage = "connection";
  let hash: Hash | null = null;

  const fail = (cause: unknown): GalleryAdminResult => {
    dependencies.dispatch({ type: "failed", stage, cause });
    return { status: "failed", stage, cause };
  };

  try {
    let wallet = await dependencies.getWalletContext();
    if (!wallet.account) return fail(new Error("Connect an admin wallet."));
    if (wallet.chainId !== targetChainId) {
      stage = "switch_chain";
      dependencies.dispatch({ type: "switching_chain" });
      await dependencies.switchChain(targetChainId);
      wallet = await dependencies.getWalletContext();
    }
    if (!wallet.account || wallet.chainId !== targetChainId) {
      return fail(new Error("The wallet did not switch to Base Sepolia."));
    }
    const account = wallet.account;

    stage = "simulation";
    dependencies.dispatch({ type: "simulating" });
    const prepared = await dependencies.simulate(call, account);
    const current = await dependencies.getWalletContext();
    if (
      !current.account ||
      current.chainId !== targetChainId ||
      !isAddressEqual(current.account, account)
    ) {
      return fail(
        new Error("The connected wallet or chain changed before submission."),
      );
    }

    stage = "wallet";
    dependencies.dispatch({ type: "wallet_requested" });
    hash = await dependencies.write(prepared, call, account);
    dependencies.dispatch({ type: "broadcast", hash });

    stage = "receipt";
    let replacement:
      | { reason: ReplacementReason; hash: Hash }
      | undefined;
    let receipt;
    try {
      receipt = await dependencies.waitForReceipt({
        hash,
        onReplaced(next) {
          replacement = next;
          hash = next.hash;
          dependencies.dispatch({
            type: "replacement",
            reason: next.reason,
            hash: next.hash,
          });
        },
      });
    } catch (cause) {
      if (!replacement || replacement.reason === "repriced") {
        dependencies.dispatch({ type: "outcome_unknown", cause });
        return { status: "outcome_unknown", hash, cause };
      }
      return fail(cause);
    }
    if (replacement && replacement.reason !== "repriced") {
      return fail(
        new Error(
          replacement.reason === "cancelled"
            ? "The replacement cancelled this transaction."
            : "A different transaction replaced this admin action.",
        ),
      );
    }
    if (receipt.status === "reverted") {
      return fail(new Error("The admin transaction reverted onchain."));
    }

    stage = "refresh";
    await dependencies.refresh(call);
    dependencies.dispatch({ type: "confirmed" });
    return { status: "confirmed", hash };
  } catch (cause) {
    return fail(cause);
  }
}

export function createGalleryAdminSubmissionGate() {
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
