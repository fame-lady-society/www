import type { Address, Hash } from "viem";

export type GalleryLiquidityCall =
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
  | "simulating_approval"
  | "awaiting_approval_wallet"
  | "confirming_approval"
  | "simulating"
  | "awaiting_wallet"
  | "confirming"
  | "confirmed"
  | "confirmed_refreshing"
  | "error";

export type GalleryLiquidityActionState = Readonly<{
  status: GalleryLiquidityActionStatus;
  call: GalleryLiquidityCall | null;
  approvalRequired: boolean | null;
  approvalHash: Hash | null;
  hash: Hash | null;
  failure: { stage: string; cause: unknown } | null;
}>;

export const initialGalleryLiquidityActionState: GalleryLiquidityActionState = {
  status: "idle",
  call: null,
  approvalRequired: false,
  approvalHash: null,
  hash: null,
  failure: null,
};

export type GalleryLiquidityEvent =
  | {
      type: "started";
      call: GalleryLiquidityCall;
      approvalCheck?: boolean;
    }
  | { type: "switching_chain" }
  | { type: "simulating_approval" }
  | { type: "approval_requirement_resolved"; required: boolean }
  | { type: "approval_wallet_requested" }
  | { type: "approval_broadcast"; hash: Hash }
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
        approvalRequired: event.approvalCheck ? null : false,
      };
    case "switching_chain":
      return { ...state, status: "switching_chain" };
    case "simulating_approval":
      return { ...state, status: "simulating_approval", failure: null };
    case "approval_requirement_resolved":
      return { ...state, approvalRequired: event.required };
    case "approval_wallet_requested":
      return { ...state, status: "awaiting_approval_wallet" };
    case "approval_broadcast":
      return {
        ...state,
        status: "confirming_approval",
        approvalHash: event.hash,
      };
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
  approval?: Readonly<{
    isRequired: (account: Address) => Promise<boolean>;
    simulate: (account: Address) => Promise<unknown>;
    onConfirmed?: (account: Address) => void | Promise<void>;
  }>;
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
  dependencies.dispatch({
    type: "started",
    call,
    approvalCheck: Boolean(dependencies.approval),
  });
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

    if (dependencies.approval) {
      stage = "approval_read";
      dependencies.dispatch({ type: "simulating_approval" });
      const approvalRequired = await dependencies.approval.isRequired(
        wallet.account,
      );
      dependencies.dispatch({
        type: "approval_requirement_resolved",
        required: approvalRequired,
      });

      if (approvalRequired) {
        stage = "approval_simulation";
        const preparedApproval = await dependencies.approval.simulate(
          wallet.account,
        );

        stage = "approval_wallet";
        dependencies.dispatch({ type: "approval_wallet_requested" });
        const approvalHash = await dependencies.write(preparedApproval);
        dependencies.dispatch({
          type: "approval_broadcast",
          hash: approvalHash,
        });

        stage = "approval_receipt";
        const approvalReceipt = await dependencies.waitForReceipt(
          approvalHash,
          1,
        );
        if (approvalReceipt.status === "reverted") {
          return fail(new Error("The liquidity approval reverted onchain."));
        }
        await dependencies.approval.onConfirmed?.(wallet.account);
      }
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
    "simulating_approval",
    "awaiting_approval_wallet",
    "confirming_approval",
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

export function hasGalleryLiquidityStakeLegStarted(
  state: GalleryLiquidityActionState,
) {
  if (state.call?.kind !== "deposit" || state.approvalRequired !== true) {
    return false;
  }
  if (
    [
      "simulating",
      "awaiting_wallet",
      "confirming",
      "confirmed",
      "confirmed_refreshing",
    ].includes(state.status)
  ) {
    return true;
  }
  return (
    state.status === "error" &&
    ["simulation", "wallet", "receipt", "refresh"].includes(
      state.failure?.stage ?? "",
    )
  );
}
