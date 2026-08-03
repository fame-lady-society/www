import type { Address, Hash } from "viem";

export type GalleryLiquidityCall =
  | Readonly<{ kind: "deposit_approval" }>
  | Readonly<{ kind: "deposit"; tokenIds: readonly bigint[] }>
  | Readonly<{ kind: "selected_withdrawal_approval"; amount: bigint }>
  | Readonly<{ kind: "random_withdrawal" }>
  | Readonly<{
      kind: "selected_withdrawal";
      tokenId: bigint;
      maxPremium: bigint;
    }>;

export type GalleryLiquidityActionStatus =
  | "idle"
  | "switching_chain"
  | "simulating"
  | "awaiting_wallet"
  | "confirming"
  | "confirmed"
  | "confirmed_refreshing"
  | "error";

export type GalleryLiquidityActionState = Readonly<{
  status: GalleryLiquidityActionStatus;
  call: GalleryLiquidityCall | null;
  hash: Hash | null;
  failure: { stage: string; cause: unknown } | null;
}>;

export const initialGalleryLiquidityActionState: GalleryLiquidityActionState = {
  status: "idle",
  call: null,
  hash: null,
  failure: null,
};

export type GalleryLiquidityEvent =
  | { type: "started"; call: GalleryLiquidityCall }
  | { type: "switching_chain" }
  | { type: "simulating" }
  | { type: "wallet_requested" }
  | { type: "broadcast"; hash: Hash }
  | { type: "confirmed" }
  | { type: "confirmed_refreshing"; cause: unknown }
  | { type: "failed"; stage: string; cause: unknown }
  | { type: "reset" };

export function galleryLiquidityActionReducer(
  state: GalleryLiquidityActionState,
  event: GalleryLiquidityEvent,
): GalleryLiquidityActionState {
  switch (event.type) {
    case "started":
      return {
        ...initialGalleryLiquidityActionState,
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
      return initialGalleryLiquidityActionState;
  }
}

type GalleryLiquidityActionDependencies = Readonly<{
  dispatch: (event: GalleryLiquidityEvent) => void;
  getWalletContext: () =>
    | { account: Address | null; chainId: number | undefined }
    | Promise<{ account: Address | null; chainId: number | undefined }>;
  switchChain: (chainId: number) => Promise<unknown>;
  simulate: (call: GalleryLiquidityCall, account: Address) => Promise<unknown>;
  write: (preparedRequest: unknown) => Promise<Hash>;
  waitForReceipt: (
    hash: Hash,
    confirmations: 1,
  ) => Promise<{ status: "success" | "reverted" }>;
  refresh: (call: GalleryLiquidityCall) => Promise<void>;
}>;

export type GalleryLiquidityActionResult =
  | { status: "confirmed"; hash: Hash }
  | { status: "confirmed_refreshing"; hash: Hash; cause: unknown }
  | { status: "failed"; stage: string; cause: unknown };

export async function executeGalleryLiquidityAction(
  call: GalleryLiquidityCall,
  targetChainId: number,
  dependencies: GalleryLiquidityActionDependencies,
): Promise<GalleryLiquidityActionResult> {
  dependencies.dispatch({ type: "started", call });
  let stage = "connection";

  const fail = (cause: unknown): GalleryLiquidityActionResult => {
    dependencies.dispatch({ type: "failed", stage, cause });
    return { status: "failed", stage, cause };
  };

  try {
    let wallet = await dependencies.getWalletContext();
    if (!wallet.account)
      return fail(new Error("Connect a wallet to continue."));
    if (wallet.chainId !== targetChainId) {
      stage = "switch_chain";
      dependencies.dispatch({ type: "switching_chain" });
      await dependencies.switchChain(targetChainId);
      wallet = await dependencies.getWalletContext();
    }
    if (!wallet.account || wallet.chainId !== targetChainId) {
      return fail(
        new Error("The wallet did not switch to the gallery network."),
      );
    }

    stage = "simulation";
    dependencies.dispatch({ type: "simulating" });
    const prepared = await dependencies.simulate(call, wallet.account);

    stage = "wallet";
    dependencies.dispatch({ type: "wallet_requested" });
    const hash = await dependencies.write(prepared);
    dependencies.dispatch({ type: "broadcast", hash });

    stage = "receipt";
    const receipt = await dependencies.waitForReceipt(hash, 1);
    if (receipt.status === "reverted") {
      return fail(new Error("The liquidity transaction reverted onchain."));
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

export function isGalleryLiquidityActionBusy(
  state: GalleryLiquidityActionState,
) {
  return [
    "switching_chain",
    "simulating",
    "awaiting_wallet",
    "confirming",
  ].includes(state.status);
}

export function isGalleryLiquidityActionTerminal(
  state: GalleryLiquidityActionState,
) {
  return ["confirmed", "confirmed_refreshing", "error"].includes(state.status);
}
