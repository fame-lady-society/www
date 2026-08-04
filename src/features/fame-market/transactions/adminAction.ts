import {
  isAddress,
  maxUint256,
  parseUnits,
  type Address,
  type Hash,
} from "viem";
import type { GalleryAdminCall } from "../types";

const MAX_INPUT_LENGTH = 80;

export function parseGalleryFee(value: string) {
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
  const fee = parseUnits(normalized, 18);
  if (fee > maxUint256) {
    throw new Error("TEST fee exceeds a uint256 value.");
  }
  return fee;
}

export function parseGalleryFeeRecipient(value: string): Address {
  const normalized = value.trim();
  if (!isAddress(normalized)) {
    throw new Error("Enter a valid fee recipient address.");
  }
  return normalized;
}

export type GalleryAdminStatus =
  | "idle"
  | "switching_chain"
  | "simulating"
  | "awaiting_wallet"
  | "confirming"
  | "confirmed"
  | "confirmed_refreshing"
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
  | { type: "confirmed" }
  | { type: "confirmed_refreshing"; cause: unknown }
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
    case "confirmed":
      return { ...state, status: "confirmed", failure: null };
    case "confirmed_refreshing":
      return {
        ...state,
        status: "confirmed_refreshing",
        failure: { stage: "refresh", cause: event.cause },
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
  write: (preparedRequest: unknown) => Promise<Hash>;
  waitForReceipt: (
    hash: Hash,
    confirmations: 1,
  ) => Promise<{ status: "success" | "reverted" }>;
  refresh: (call: GalleryAdminCall) => Promise<void>;
};

export type GalleryAdminResult =
  | { status: "confirmed"; hash: Hash }
  | { status: "confirmed_refreshing"; hash: Hash; cause: unknown }
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

    stage = "simulation";
    dependencies.dispatch({ type: "simulating" });
    const preparedRequest = await dependencies.simulate(call, wallet.account);

    stage = "wallet";
    dependencies.dispatch({ type: "wallet_requested" });
    hash = await dependencies.write(preparedRequest);
    dependencies.dispatch({ type: "broadcast", hash });

    stage = "receipt";
    const receipt = await dependencies.waitForReceipt(hash, 1);
    if (receipt.status === "reverted") {
      return fail(new Error("The admin transaction reverted onchain."));
    }

    stage = "refresh";
    try {
      await dependencies.refresh(call);
    } catch (cause) {
      dependencies.dispatch({ type: "confirmed_refreshing", cause });
      return { status: "confirmed_refreshing", hash, cause };
    }
    dependencies.dispatch({ type: "confirmed" });
    return { status: "confirmed", hash };
  } catch (cause) {
    return fail(cause);
  }
}

export function isGalleryAdminActionBusy(state: GalleryAdminState) {
  return [
    "switching_chain",
    "simulating",
    "awaiting_wallet",
    "confirming",
  ].includes(state.status);
}
