"use client";

import {
  getConnection,
  getConnectorClient,
  waitForTransactionReceipt,
} from "@wagmi/core";
import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAddressEqual, type Hash, type Hex } from "viem";
import {
  useConfig,
  useConnection,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { useGalleryRuntime } from "../config/galleryRuntime";
import {
  galleryRedemptionConsentKey,
  isGalleryRedemptionQuoteCurrent,
} from "../redemption/quote";
import {
  galleryRedemptionApprovalReadRequest,
  galleryRedemptionApprovalRequest,
  galleryRedemptionRequest,
} from "../transactions/redemptionRequests";
import type {
  GalleryRedemptionOutputAsset,
  GalleryRedemptionQuote,
} from "../types";

export type GalleryRedemptionTransactionStatus =
  | "idle"
  | "simulating_approval"
  | "awaiting_approval_wallet"
  | "confirming_approval"
  | "approval_confirmed"
  | "simulating_redemption"
  | "awaiting_redemption_wallet"
  | "confirming_redemption"
  | "refreshing"
  | "success"
  | "error";

export type GalleryRedemptionOperation = "approval" | "redemption";

export type GalleryRedemptionTransactionState = Readonly<{
  status: GalleryRedemptionTransactionStatus;
  operation?: GalleryRedemptionOperation;
  hash?: Hash;
  error?: Error;
}>;

type Receipt = Readonly<{
  transactionHash: Hash;
  blockNumber: bigint;
}>;

type SubmitDependencies<TRequest> = Readonly<{
  request: TRequest;
  simulate: (request: TRequest) => Promise<{ request: unknown }>;
  write: (request: unknown) => Promise<Hash>;
  waitForReceipt: (hash: Hash, confirmations: number) => Promise<Receipt>;
  onHash?: (hash: Hash) => void;
  onStage?: (
    stage: "simulating" | "awaiting_wallet" | "confirming" | "refreshing",
  ) => void;
}>;

export function galleryRedemptionPrimaryAction(input: {
  approved: boolean;
  quoteCurrent: boolean;
}) {
  if (!input.quoteCurrent) return "blocked" as const;
  return input.approved ? ("review" as const) : ("approve" as const);
}

export function galleryRedemptionStateForStage(
  operation: GalleryRedemptionOperation,
  stage: "simulating" | "awaiting_wallet" | "confirming" | "refreshing",
  current: GalleryRedemptionTransactionState,
): GalleryRedemptionTransactionState {
  const status =
    stage === "simulating"
      ? operation === "approval"
        ? "simulating_approval"
        : "simulating_redemption"
      : stage === "awaiting_wallet"
        ? operation === "approval"
          ? "awaiting_approval_wallet"
          : "awaiting_redemption_wallet"
        : stage === "confirming"
          ? operation === "approval"
            ? "confirming_approval"
            : "confirming_redemption"
          : "refreshing";
  const preserveHash =
    current.operation === operation &&
    (stage === "confirming" || stage === "refreshing");
  return {
    status,
    operation,
    hash: preserveHash ? current.hash : undefined,
  };
}

export function galleryRedemptionTransactions(
  state: GalleryRedemptionTransactionState,
) {
  if (!state.operation || !state.hash) return [];
  return [
    {
      kind:
        state.operation === "approval"
          ? "NFT redemption approval"
          : "Society NFT redemption",
      hash: state.hash,
    },
  ];
}

export async function assertGalleryForkWalletIdentity(input: {
  readAppCheckoutCode: () => Promise<Hex | undefined>;
  readWalletCheckoutCode: () => Promise<unknown>;
}) {
  const [appCode, walletCode] = await Promise.all([
    input.readAppCheckoutCode(),
    input.readWalletCheckoutCode(),
  ]);
  if (
    !appCode ||
    appCode === "0x" ||
    typeof walletCode !== "string" ||
    walletCode === "0x" ||
    walletCode.toLowerCase() !== appCode.toLowerCase()
  ) {
    throw new Error(
      "Your wallet is not connected to the same local Base fork as this page. Restore the wallet's fork RPC before submitting.",
    );
  }
}

export async function invalidateGalleryRedemptionQueries(
  queryClient: Pick<QueryClient, "invalidateQueries">,
) {
  await Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: ["gallery-redemption-owned"] }),
    queryClient.invalidateQueries({ queryKey: ["gallery-redemption-quote"] }),
    queryClient.invalidateQueries({ queryKey: ["balance"] }),
  ]);
}

export async function submitGalleryRedemptionApproval<TRequest>(
  input: SubmitDependencies<TRequest>,
) {
  input.onStage?.("simulating");
  const simulated = await input.simulate(input.request);
  input.onStage?.("awaiting_wallet");
  const submittedHash = await input.write(simulated.request);
  input.onHash?.(submittedHash);
  input.onStage?.("confirming");
  const receipt = await input.waitForReceipt(submittedHash, 1);
  return receipt;
}

export type GalleryRedemptionSimulation = Readonly<{
  consentKey: string;
  request: unknown;
}>;

export async function submitGalleryRedemptionTransaction<TRequest>(
  input: SubmitDependencies<TRequest> & {
    consentKey: string;
    cachedSimulation: GalleryRedemptionSimulation | null;
    refreshAfterSuccess?: () => Promise<void>;
  },
) {
  let simulation = input.cachedSimulation;
  if (!simulation || simulation.consentKey !== input.consentKey) {
    input.onStage?.("simulating");
    const result = await input.simulate(input.request);
    simulation = { consentKey: input.consentKey, request: result.request };
  }
  input.onStage?.("awaiting_wallet");
  const submittedHash = await input.write(simulation.request);
  input.onHash?.(submittedHash);
  input.onStage?.("confirming");
  const receipt = await input.waitForReceipt(submittedHash, 1);
  if (input.refreshAfterSuccess) {
    input.onStage?.("refreshing");
    await input.refreshAfterSuccess();
  }
  return { ...receipt, simulation };
}

export function useGalleryRedemption(input: {
  tokenIds: readonly bigint[];
  outputAsset: GalleryRedemptionOutputAsset;
  quote: GalleryRedemptionQuote | null;
}) {
  const runtime = useGalleryRuntime();
  const connection = useConnection();
  const wagmiConfig = useConfig();
  const publicClient = usePublicClient({ chainId: runtime.chainId });
  const queryClient = useQueryClient();
  const { mutateAsync: writeContract } = useWriteContract();
  type ExactWriteRequest = Parameters<typeof writeContract>[0];
  const checkout = runtime.checkout;
  const approvalEnabled = Boolean(
    checkout &&
      connection.address &&
      connection.chainId === runtime.chainId &&
      publicClient,
  );
  const approvalQuery = useQuery({
    queryKey: [
      "gallery-redemption-approval",
      runtime.chainId,
      connection.address?.toLowerCase() ?? null,
      checkout?.address.toLowerCase() ?? null,
    ],
    enabled: approvalEnabled,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: () => {
      if (!publicClient || !connection.address || !checkout) {
        throw new Error("NFT redemption approval is unavailable.");
      }
      return publicClient.readContract(
        galleryRedemptionApprovalReadRequest(
          connection.address,
          runtime.addresses.mirror,
          checkout.address,
        ),
      );
    },
  });
  const [state, setState] = useState<GalleryRedemptionTransactionState>({
    status: "idle",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [simulationState, setSimulationState] = useState<
    | { status: "idle" }
    | { status: "pending"; consentKey: string }
    | { status: "ready"; simulation: GalleryRedemptionSimulation }
    | { status: "error"; consentKey: string; error: Error }
  >({ status: "idle" });
  const simulationRef = useRef<GalleryRedemptionSimulation | null>(null);
  const approved = approvalQuery.data === true;
  const quoteCurrent = Boolean(
    input.quote &&
      isGalleryRedemptionQuoteCurrent(input.quote, {
        account: connection.address,
        chainId: connection.chainId,
        tokenIds: input.tokenIds,
        outputAsset: input.outputAsset,
      }),
  );

  useEffect(() => {
    if (!approved || !quoteCurrent || !input.quote || !publicClient) {
      simulationRef.current = null;
      setSimulationState({ status: "idle" });
      return;
    }
    const consentKey = galleryRedemptionConsentKey(input.quote);
    if (simulationRef.current?.consentKey === consentKey) return;
    let cancelled = false;
    setSimulationState({ status: "pending", consentKey });
    const request = galleryRedemptionRequest(input.quote);
    void publicClient
      .simulateContract(request)
      .then((simulation) => {
        if (cancelled) return;
        const ready = { consentKey, request: simulation.request };
        simulationRef.current = ready;
        setSimulationState({ status: "ready", simulation: ready });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        const error =
          cause instanceof Error
            ? cause
            : new Error("Society redemption simulation failed.");
        simulationRef.current = null;
        setSimulationState({ status: "error", consentKey, error });
      });
    return () => {
      cancelled = true;
    };
  }, [approved, input.quote, publicClient, quoteCurrent]);

  const waitForReceipt = useCallback(
    async (hash: Hash, confirmations: number): Promise<Receipt> => {
      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash,
        chainId: runtime.chainId,
        confirmations,
      });
      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      };
    },
    [runtime.chainId, wagmiConfig],
  );

  const latestConnection = useCallback(() => {
    const latest = getConnection(wagmiConfig);
    if (
      !latest.address ||
      latest.chainId !== runtime.chainId ||
      !checkout ||
      !publicClient
    ) {
      throw new Error(
        `Connect a wallet on ${runtime.labels.network} to continue.`,
      );
    }
    return latest.address;
  }, [
    checkout,
    publicClient,
    runtime.chainId,
    runtime.labels.network,
    wagmiConfig,
  ]);

  const assertForkWallet = useCallback(
    async (account: `0x${string}`) => {
      if (!checkout || !publicClient) {
        throw new Error("NFT redemption is unavailable.");
      }
      const connectorClient = await getConnectorClient(wagmiConfig, {
        account,
        chainId: runtime.chainId,
      });
      await assertGalleryForkWalletIdentity({
        readAppCheckoutCode: () =>
          publicClient.getCode({ address: checkout.address }),
        readWalletCheckoutCode: () =>
          connectorClient.request({
            method: "eth_getCode",
            params: [checkout.address, "latest"],
          }),
      });
    },
    [checkout, publicClient, runtime.chainId, wagmiConfig],
  );

  const approve = useCallback(async () => {
    let submittedHash: Hash | undefined;
    try {
      const account = latestConnection();
      if (!checkout || !publicClient)
        throw new Error("NFT redemption is unavailable.");
      await assertForkWallet(account);
      setModalOpen(true);
      const request = galleryRedemptionApprovalRequest(
        account,
        runtime.chainId,
        runtime.addresses.mirror,
        checkout.address,
      );
      await submitGalleryRedemptionApproval({
        request,
        simulate: (candidate) => publicClient.simulateContract(candidate),
        write: (candidate) => writeContract(candidate as ExactWriteRequest),
        waitForReceipt,
        onHash: (hash) => {
          submittedHash = hash;
          setState((current) => ({ ...current, operation: "approval", hash }));
        },
        onStage: (stage) =>
          setState((current) =>
            galleryRedemptionStateForStage("approval", stage, current),
          ),
      });
      setState((current) => ({
        status: "approval_confirmed",
        operation: "approval",
        hash: current.operation === "approval" ? current.hash : submittedHash,
      }));
      await approvalQuery.refetch();
    } catch (cause) {
      setState((current) => ({
        status: "error",
        operation: "approval",
        hash:
          submittedHash ??
          (current.operation === "approval" ? current.hash : undefined),
        error:
          cause instanceof Error
            ? cause
            : new Error("NFT redemption approval failed."),
      }));
      setModalOpen(true);
    }
  }, [
    approvalQuery,
    assertForkWallet,
    checkout,
    latestConnection,
    publicClient,
    runtime.addresses.mirror,
    runtime.chainId,
    waitForReceipt,
    writeContract,
  ]);

  const redeem = useCallback(async () => {
    let submittedHash: Hash | undefined;
    let lastStage:
      | "simulating"
      | "awaiting_wallet"
      | "confirming"
      | "refreshing"
      | undefined;
    try {
      const account = latestConnection();
      if (!approved)
        throw new Error("Approve NFT redemption before burning NFTs.");
      if (!input.quote || !quoteCurrent) {
        throw new Error(
          "The redemption quote changed or expired. Refresh it before burning.",
        );
      }
      if (
        !isGalleryRedemptionQuoteCurrent(input.quote, {
          account,
          chainId: runtime.chainId,
          tokenIds: input.tokenIds,
          outputAsset: input.outputAsset,
          now: Date.now(),
        })
      ) {
        throw new Error(
          "The redemption quote changed or expired. Refresh it before burning.",
        );
      }
      if (!isAddressEqual(account, input.quote.account)) {
        throw new Error("The connected redemption account changed.");
      }
      if (simulationState.status === "pending") {
        throw new Error("The redemption simulation is still running.");
      }
      if (simulationState.status === "error") throw simulationState.error;
      if (!publicClient) throw new Error("Base RPC client is unavailable.");
      await assertForkWallet(account);
      setModalOpen(true);
      const request = galleryRedemptionRequest(input.quote);
      const consentKey = galleryRedemptionConsentKey(input.quote);
      const result = await submitGalleryRedemptionTransaction({
        request,
        consentKey,
        cachedSimulation: simulationRef.current,
        simulate: (candidate) => publicClient.simulateContract(candidate),
        write: (candidate) => writeContract(candidate as ExactWriteRequest),
        waitForReceipt,
        onHash: (hash) => {
          submittedHash = hash;
          setState((current) => ({
            ...current,
            operation: "redemption",
            hash,
          }));
        },
        onStage: (stage) => {
          lastStage = stage;
          setState((current) =>
            galleryRedemptionStateForStage("redemption", stage, current),
          );
        },
        refreshAfterSuccess: () =>
          invalidateGalleryRedemptionQueries(queryClient),
      });
      simulationRef.current = result.simulation;
      setState({
        status: "success",
        operation: "redemption",
        hash: result.transactionHash,
      });
    } catch (cause) {
      const error =
        cause instanceof Error
          ? cause
          : new Error("Society redemption failed.");
      if (submittedHash) {
        simulationRef.current = null;
        setSimulationState({ status: "idle" });
        void queryClient.invalidateQueries({
          queryKey: ["gallery-redemption-quote"],
        });
      } else if (lastStage === "simulating" && input.quote) {
        const consentKey = galleryRedemptionConsentKey(input.quote);
        simulationRef.current = null;
        setSimulationState({ status: "error", consentKey, error });
      }
      setState((current) => ({
        status: "error",
        operation: "redemption",
        hash:
          submittedHash ??
          (current.operation === "redemption" ? current.hash : undefined),
        error,
      }));
      setModalOpen(true);
    }
  }, [
    approved,
    assertForkWallet,
    input,
    latestConnection,
    publicClient,
    queryClient,
    quoteCurrent,
    runtime.chainId,
    simulationState,
    waitForReceipt,
    writeContract,
  ]);

  const transactions = useMemo(
    () => galleryRedemptionTransactions(state),
    [state],
  );

  return {
    approved,
    approvalLoading: approvalEnabled && approvalQuery.isFetching,
    approvalError:
      approvalQuery.error instanceof Error ? approvalQuery.error : null,
    quoteCurrent,
    simulationPending: simulationState.status === "pending",
    simulationError:
      simulationState.status === "error" ? simulationState.error : null,
    state,
    transactions,
    modalOpen,
    setModalOpen,
    approve,
    redeem,
    locked:
      state.status !== "idle" &&
      state.status !== "approval_confirmed" &&
      state.status !== "success" &&
      state.status !== "error",
  };
}
