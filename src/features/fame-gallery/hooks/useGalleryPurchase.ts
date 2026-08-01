"use client";

import { getConnection } from "@wagmi/core";
import { useModal } from "connectkit";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { Hash } from "viem";
import {
  useConfig,
  useConnection,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import {
  creatorArtistMagicAbi,
  fameAbi,
  fameMirrorAbi,
  universalPoolArtMarketplaceAbi,
} from "../../../wagmi";
import { useGalleryRuntime } from "../config/galleryRuntime";
import {
  freezeGalleryBuyerTerms,
  resolveGalleryFulfillment,
  type GalleryFulfillmentReadSource,
} from "../fulfillment/resolveFulfillment";
import {
  executeGalleryPurchase,
  galleryPurchaseReducer,
  initialGalleryPurchaseState,
  type GalleryPurchaseErrorStage,
  type GalleryPurchaseEvent,
  type GalleryPurchaseStatus,
} from "../transactions/purchaseQueue";
import {
  galleryApprovalContractRequest,
  galleryPurchaseContractRequest,
} from "../transactions/contractRequests";
import {
  freezeGalleryCheckoutBuyerTerms,
  galleryCheckoutAllowanceRequest,
  galleryCheckoutApprovalContractRequest,
  galleryCheckoutContractRequest,
} from "../transactions/checkoutRequests";
import { verifyGalleryPurchase } from "../transactions/verifyPurchase";
import type {
  GalleryArtworkTarget,
  GalleryCheckoutQuote,
  GalleryFulfillmentRoute,
  GalleryFrozenBuyerTerms,
  GalleryGlobalState,
  GalleryPaymentAsset,
  GalleryVerifiedAcquisition,
} from "../types";

type GalleryPurchaseInputs = {
  globalState: GalleryGlobalState | null;
  catalog: readonly GalleryArtworkTarget[];
  heldTargets: readonly GalleryArtworkTarget[];
  refreshGlobal: () => Promise<void>;
  refreshPool: () => Promise<void>;
  revalidateAffectedTokenIds: (
    tokenIds: readonly bigint[],
  ) => Promise<readonly GalleryArtworkTarget[]>;
  getPendingInitialHeldTokenIds: () => Promise<readonly bigint[]> | null;
  recoverHeldTokenIds: () => Promise<readonly bigint[]>;
  paymentAsset: GalleryPaymentAsset;
  checkoutQuote: GalleryCheckoutQuote | null;
};

type ActiveAttempt = {
  target: GalleryArtworkTarget;
  terms: GalleryFrozenBuyerTerms | null;
  displayedUnit: bigint;
  displayedPremium: bigint;
  paymentAsset: GalleryPaymentAsset;
  checkoutQuote: GalleryCheckoutQuote | null;
};

type GalleryPurchaseRequest = ReturnType<typeof galleryPurchaseContractRequest>;
type GalleryHeldPurchaseRequest = Extract<
  GalleryPurchaseRequest,
  { functionName: "purchaseHeld" }
>;
type GalleryPoolPurchaseRequest = Extract<
  GalleryPurchaseRequest,
  { functionName: "purchasePool" }
>;
type GalleryCheckoutRequest = ReturnType<typeof galleryCheckoutContractRequest>;
type GalleryHeldCheckoutRequest = Extract<
  GalleryCheckoutRequest,
  { functionName: "checkoutHeld" }
>;
type GalleryPoolCheckoutRequest = Extract<
  GalleryCheckoutRequest,
  { functionName: "checkoutPool" }
>;

export function isFreshGalleryCheckoutQuote(
  quote: GalleryCheckoutQuote | null,
  now = Date.now(),
) {
  return quote !== null && quote.expiresAt.getTime() > now;
}

export function galleryCheckoutSimulationKey(input: {
  terms: GalleryFrozenBuyerTerms;
  route: GalleryFulfillmentRoute;
}) {
  const checkout = input.terms.checkout;
  if (!checkout) return null;
  return [
    input.terms.chainId,
    input.terms.account.toLowerCase(),
    input.terms.selectedTarget.targetId,
    input.terms.artworkHash.toLowerCase(),
    input.terms.maxPremium,
    checkout.paymentAsset,
    checkout.routeHash.toLowerCase(),
    input.route.kind,
    input.route.shellId,
    input.route.kind === "pool" ? input.route.sourceId : 0n,
  ].join(":");
}

export function galleryCheckoutSubmissionError(input: {
  terms: GalleryFrozenBuyerTerms;
  quote: GalleryCheckoutQuote | null;
  connectedAccount: `0x${string}` | undefined;
  connectedChainId: number | undefined;
  networkName: string;
  now?: number;
}) {
  if (
    !input.connectedAccount ||
    input.connectedAccount.toLowerCase() !==
      input.terms.account.toLowerCase() ||
    input.connectedChainId !== input.terms.chainId
  ) {
    return new Error(
      `The connected account or ${input.networkName} chain changed.`,
    );
  }
  if (
    input.terms.checkout &&
    !isFreshGalleryCheckoutQuote(input.quote, input.now)
  ) {
    return new Error(
      "The checkout quote expired. Refresh the quote before buying.",
    );
  }
  return null;
}

function unavailableClientError(networkName: string) {
  return new Error(`${networkName} RPC client is unavailable.`);
}

function connectionError(tokenSymbol: string) {
  return new Error(`Connect a wallet to buy with ${tokenSymbol}.`);
}

export function logGalleryPurchaseError(
  stage: GalleryPurchaseErrorStage,
  cause: unknown,
) {
  console.error(`[gallery purchase:${stage}]`, cause);
}

export async function simulateGalleryCheckoutRequest<TRequest>(input: {
  request: TRequest;
  simulate: (request: TRequest) => Promise<{ request: unknown }>;
  onDiagnostic: (cause: unknown) => void;
}): Promise<unknown> {
  try {
    return (await input.simulate(input.request)).request;
  } catch (cause) {
    input.onDiagnostic(cause);
    return input.request;
  }
}

function logGalleryCheckoutSimulationDiagnostic(cause: unknown) {
  console.warn("[gallery checkout:purchase_simulation]", cause);
}

export function galleryCandidateTokenIdsForArtwork(
  catalog: readonly GalleryArtworkTarget[],
  artworkHash: Hash,
) {
  const normalizedHash = artworkHash.toLowerCase();
  return catalog
    .filter((target) => target.artworkHash?.toLowerCase() === normalizedHash)
    .map(({ tokenId }) => tokenId);
}

export function isTokenInGalleryArtPool(
  tokenId: bigint,
  startIndex: bigint,
  endIndex: bigint,
) {
  return tokenId >= startIndex && tokenId <= endIndex;
}

export function shouldAutoCloseGalleryPurchaseModal(
  status: GalleryPurchaseStatus,
) {
  return status === "refreshing" || status === "verified";
}

export async function refreshGalleryAfterPurchase(
  acquisition: GalleryVerifiedAcquisition,
  dependencies: Pick<
    GalleryPurchaseInputs,
    "refreshGlobal" | "refreshPool" | "revalidateAffectedTokenIds"
  >,
) {
  const results = await Promise.allSettled([
    dependencies.refreshGlobal(),
    dependencies.refreshPool(),
    dependencies.revalidateAffectedTokenIds(acquisition.affectedTokenIds),
  ]);
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (failure) throw failure.reason;
}

export function useGalleryPurchase(inputs: GalleryPurchaseInputs) {
  const config = useGalleryRuntime();
  const marketplace = config.addresses.gallery;
  const fame = config.addresses.fame;
  const mirror = config.addresses.mirror;
  const creatorMagic = config.addresses.creatorMagic;
  const wagmiConfig = useConfig();
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: config.chainId });
  const { switchChainAsync } = useSwitchChain();
  const { mutateAsync: writeContract } = useWriteContract();
  type ExactWagmiWriteRequest = Parameters<typeof writeContract>[0];
  const connectModal = useModal();
  const [state, dispatch] = useReducer(
    galleryPurchaseReducer,
    initialGalleryPurchaseState,
  );
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [activeArtworkKey, setActiveArtworkKey] = useState<string | null>(null);
  const activeAttempt = useRef<ActiveAttempt | null>(null);
  const selectedTarget = useRef<GalleryArtworkTarget | null>(null);
  const waitingForConnection = useRef(false);
  const sawConnectModalOpen = useRef(false);
  const inputsRef = useRef(inputs);
  const checkoutSimulation = useRef<{
    key: string;
    request: unknown;
  } | null>(null);
  inputsRef.current = inputs;

  const queueDispatch = useCallback((event: GalleryPurchaseEvent) => {
    if (event.type === "failed") {
      logGalleryPurchaseError(event.stage, event.cause);
    } else if (event.type === "verification_failed") {
      logGalleryPurchaseError("verification", event.cause);
    } else if (event.type === "refresh_failed") {
      logGalleryPurchaseError("refresh", event.cause);
    }
    dispatch(event);
  }, []);

  const failOutsideQueue = useCallback(
    (stage: GalleryPurchaseErrorStage, cause: unknown) => {
      queueDispatch({ type: "failed", stage, cause });
      setTransactionModalOpen(true);
      activeAttempt.current = null;
      waitingForConnection.current = false;
      sawConnectModalOpen.current = false;
      setActiveArtworkKey(null);
    },
    [queueDispatch],
  );

  const executeAttempt = useCallback(
    async () => {
      const attempt = activeAttempt.current;
      if (!attempt) return;
      if (!publicClient) {
        failOutsideQueue(
          "connection",
          unavailableClientError(config.labels.network),
        );
        return;
      }

      setTransactionModalOpen(true);
      let outerStage: GalleryPurchaseErrorStage = "connection";
      try {
        let latestConnection = getConnection(wagmiConfig);
        if (!latestConnection.address) {
          failOutsideQueue("connection", connectionError(config.token.symbol));
          return;
        }
        if (latestConnection.chainId !== config.chainId) {
          outerStage = "switch_chain";
          dispatch({ type: "switching_chain" });
          await switchChainAsync({ chainId: config.chainId });
          latestConnection = getConnection(wagmiConfig);
        }
        if (
          !latestConnection.address ||
          latestConnection.chainId !== config.chainId
        ) {
          failOutsideQueue(
            "switch_chain",
            new Error(`Switch to ${config.labels.network} to continue.`),
          );
          return;
        }

        if (!attempt.target.artworkHash) {
          failOutsideQueue(
            "fulfillment",
            new Error("This artwork is not ready to purchase."),
          );
          return;
        }

        const checkoutQuote = attempt.checkoutQuote;
        if (
          attempt.paymentAsset !== "FAME" &&
          (!checkoutQuote || !isFreshGalleryCheckoutQuote(checkoutQuote))
        ) {
          failOutsideQueue(
            "purchase_simulation",
            new Error(
              "The checkout quote expired. Refresh the quote before buying.",
            ),
          );
          return;
        }
        const terms =
          attempt.terms ??
          (attempt.paymentAsset === "FAME"
            ? freezeGalleryBuyerTerms(
                {
                  account: latestConnection.address,
                  selectedTarget: {
                    targetId: attempt.target.targetId,
                    tokenId: attempt.target.tokenId,
                  },
                  artworkHash: attempt.target.artworkHash,
                  unit: attempt.displayedUnit,
                  displayedPremium: attempt.displayedPremium,
                },
                {
                  chainId: config.chainId,
                  marketplace,
                },
              )
            : freezeGalleryCheckoutBuyerTerms({
                chainId: config.chainId,
                account: latestConnection.address,
                target: attempt.target,
                quote: checkoutQuote!,
              }));
        attempt.terms = terms;

        const artPoolBoundsByBlock = new Map<
          bigint,
          Promise<readonly [bigint, bigint]>
        >();
        const readArtPoolBounds = (blockNumber: bigint) => {
          const current = artPoolBoundsByBlock.get(blockNumber);
          if (current) return current;
          const started = Promise.all([
            publicClient.readContract({
              abi: creatorArtistMagicAbi,
              address: creatorMagic,
              functionName: "artPoolStartIndex",
              blockNumber,
            }),
            publicClient.readContract({
              abi: creatorArtistMagicAbi,
              address: creatorMagic,
              functionName: "artPoolEndIndex",
              blockNumber,
            }),
          ]).then(([startIndex, endIndex]) =>
            Object.freeze([startIndex, endIndex] as const),
          );
          artPoolBoundsByBlock.set(blockNumber, started);
          return started;
        };

        const fulfillmentSource: GalleryFulfillmentReadSource = {
          captureBlockNumber: () => publicClient.getBlockNumber(),
          readPremium: (blockNumber) =>
            publicClient.readContract({
              abi: universalPoolArtMarketplaceAbi,
              address: marketplace,
              functionName: "premium",
              blockNumber,
            }),
          async readTokenState(tokenId, blockNumber) {
            const [owner, artworkHash, inMintPool, inBurnPool, artPoolBounds] =
              await Promise.all([
                publicClient.readContract({
                  abi: fameMirrorAbi,
                  address: mirror,
                  functionName: "ownerAt",
                  args: [tokenId],
                  blockNumber,
                }),
                publicClient.readContract({
                  abi: universalPoolArtMarketplaceAbi,
                  address: marketplace,
                  functionName: "artworkHash",
                  args: [tokenId],
                  blockNumber,
                }),
                publicClient.readContract({
                  abi: creatorArtistMagicAbi,
                  address: creatorMagic,
                  functionName: "isTokenInMintPool",
                  args: [tokenId],
                  blockNumber,
                }),
                publicClient.readContract({
                  abi: creatorArtistMagicAbi,
                  address: creatorMagic,
                  functionName: "isTokenInBurnedPool",
                  args: [tokenId],
                  blockNumber,
                }),
                readArtPoolBounds(blockNumber),
              ]);
            return {
              owner,
              artworkHash,
              inArtPool: isTokenInGalleryArtPool(
                tokenId,
                artPoolBounds[0],
                artPoolBounds[1],
              ),
              inMintPool,
              inBurnPool,
            };
          },
          readShellOwner: (tokenId, blockNumber) =>
            publicClient.readContract({
              abi: fameMirrorAbi,
              address: mirror,
              functionName: "ownerAt",
              args: [tokenId],
              blockNumber,
            }),
        };

        let checkoutFulfillmentRoute: GalleryFulfillmentRoute | null = null;
        await executeGalleryPurchase({
          terms,
          // A Buy action authorizes one bounded, read-only custody refresh when
          // the page's shell snapshot is stale. Transaction writes are never
          // retried by this recovery path.
          allowShellRecovery: true,
          dependencies: {
            dispatch: queueDispatch,
            readBalance: (frozen) => {
              if (frozen.checkout?.paymentAsset === "ETH") {
                return publicClient.getBalance({ address: frozen.account });
              }
              return publicClient.readContract({
                abi: fameAbi,
                address: frozen.checkout?.inputToken ?? fame,
                functionName: "balanceOf",
                args: [frozen.account],
              });
            },
            readAllowance: (frozen) => {
              if (!frozen.checkout) {
                return publicClient.readContract({
                  abi: fameAbi,
                  address: fame,
                  functionName: "allowance",
                  args: [frozen.account, marketplace],
                });
              }
              const request = galleryCheckoutAllowanceRequest({
                owner: frozen.account,
                quote: checkoutQuote!,
              });
              return request
                ? publicClient.readContract(request)
                : Promise.resolve(frozen.maximumSpend);
            },
            async simulateApproval(frozen) {
              const request = frozen.checkout
                ? galleryCheckoutApprovalContractRequest(frozen, checkoutQuote!)
                : galleryApprovalContractRequest(frozen, fame);
              if (!request) {
                throw new Error(
                  "Native ETH checkout does not require approval.",
                );
              }
              const simulation = await publicClient.simulateContract(request);
              return { request: simulation.request };
            },
            writeApproval: (request) =>
              writeContract(request as ExactWagmiWriteRequest),
            async resolveFulfillment({
              terms: frozen,
              allowShellRecovery: recover,
            }) {
              const latest = inputsRef.current;
              const pendingInitialScan = recover
                ? null
                : latest.getPendingInitialHeldTokenIds();
              const resolved = await resolveGalleryFulfillment({
                terms: frozen,
                candidateTokenIds: galleryCandidateTokenIdsForArtwork(
                  latest.catalog,
                  frozen.artworkHash,
                ),
                knownShellTokenIds: latest.heldTargets.map(
                  ({ tokenId }) => tokenId,
                ),
                source: fulfillmentSource,
                refreshShellTokenIds: recover
                  ? latest.recoverHeldTokenIds
                  : pendingInitialScan
                    ? () => pendingInitialScan
                    : undefined,
              });
              checkoutFulfillmentRoute = resolved;
              return { route: resolved };
            },
            async simulatePurchase(frozen, route) {
              const currentConnection = getConnection(wagmiConfig);
              const submissionError = galleryCheckoutSubmissionError({
                terms: frozen,
                quote: checkoutQuote,
                connectedAccount: currentConnection.address,
                connectedChainId: currentConnection.chainId,
                networkName: config.labels.network,
              });
              if (submissionError) throw submissionError;
              if (frozen.checkout) {
                if (route.kind === "held") {
                  const request = galleryCheckoutContractRequest(
                    frozen,
                    route,
                    checkoutQuote!,
                  ) as GalleryHeldCheckoutRequest;
                  const key = galleryCheckoutSimulationKey({
                    terms: frozen,
                    route,
                  })!;
                  if (checkoutSimulation.current?.key === key) {
                    return { request: checkoutSimulation.current.request };
                  }
                  const executableRequest =
                    await simulateGalleryCheckoutRequest({
                      request,
                      simulate: (candidate) =>
                        publicClient.simulateContract(candidate),
                      onDiagnostic: logGalleryCheckoutSimulationDiagnostic,
                    });
                  checkoutSimulation.current = {
                    key,
                    request: executableRequest,
                  };
                  return { request: executableRequest };
                }
                const request = galleryCheckoutContractRequest(
                  frozen,
                  route,
                  checkoutQuote!,
                ) as GalleryPoolCheckoutRequest;
                const key = galleryCheckoutSimulationKey({
                  terms: frozen,
                  route,
                })!;
                if (checkoutSimulation.current?.key === key) {
                  return { request: checkoutSimulation.current.request };
                }
                const executableRequest = await simulateGalleryCheckoutRequest({
                  request,
                  simulate: (candidate) =>
                    publicClient.simulateContract(candidate),
                  onDiagnostic: logGalleryCheckoutSimulationDiagnostic,
                });
                checkoutSimulation.current = {
                  key,
                  request: executableRequest,
                };
                return { request: executableRequest };
              }
              if (route.kind === "held") {
                const request = galleryPurchaseContractRequest(
                  frozen,
                  route,
                ) as GalleryHeldPurchaseRequest;
                const simulation = await publicClient.simulateContract(request);
                return { request: simulation.request };
              }
              const request = galleryPurchaseContractRequest(
                frozen,
                route,
              ) as GalleryPoolPurchaseRequest;
              const simulation = await publicClient.simulateContract(request);
              return { request: simulation.request };
            },
            writePurchase: (request) =>
              writeContract(request as ExactWagmiWriteRequest),
            async waitForReceipt(hash, confirmations) {
              const receipt = await publicClient.waitForTransactionReceipt({
                hash,
                confirmations,
              });
              return {
                status: receipt.status,
                blockNumber: receipt.blockNumber,
                transactionHash: receipt.transactionHash,
                logs: receipt.logs.map((log) => ({
                  address: log.address,
                  data: log.data,
                  topics: log.topics,
                  logIndex: log.logIndex,
                })),
              };
            },
            verifyPurchase: terms.checkout
              ? undefined
              : ({ receipt, hash, terms: frozen, route }) =>
                  verifyGalleryPurchase({
                    receipt,
                    expectedHash: hash,
                    terms: frozen,
                    route,
                    addresses: { marketplace, mirror },
                    dependencies: {
                      readOwnerAt: (shellId) =>
                        publicClient.readContract({
                          abi: fameMirrorAbi,
                          address: mirror,
                          functionName: "ownerAt",
                          args: [shellId],
                        }),
                      readArtworkHash: (shellId) =>
                        publicClient.readContract({
                          abi: universalPoolArtMarketplaceAbi,
                          address: marketplace,
                          functionName: "artworkHash",
                          args: [shellId],
                        }),
                    },
                  }),
            async refreshAfterPurchase(acquisition) {
              const latest = inputsRef.current;
              await refreshGalleryAfterPurchase(acquisition, latest);
            },
            async refreshAfterReceipt() {
              if (!checkoutFulfillmentRoute) {
                throw new Error(
                  "The checkout fulfillment route is unavailable.",
                );
              }
              const affectedTokenIds =
                checkoutFulfillmentRoute.kind === "held"
                  ? [checkoutFulfillmentRoute.shellId]
                  : [
                      checkoutFulfillmentRoute.shellId,
                      checkoutFulfillmentRoute.sourceId,
                    ];
              const latest = inputsRef.current;
              const results = await Promise.allSettled([
                latest.refreshGlobal(),
                latest.refreshPool(),
                latest.revalidateAffectedTokenIds(affectedTokenIds),
              ]);
              const failure = results.find(
                (result): result is PromiseRejectedResult =>
                  result.status === "rejected",
              );
              if (failure) throw failure.reason;
            },
          },
        });
      } catch (cause) {
        failOutsideQueue(outerStage, cause);
      } finally {
        activeAttempt.current = null;
        setActiveArtworkKey(null);
      }
    },
    [
      failOutsideQueue,
      config,
      creatorMagic,
      fame,
      marketplace,
      mirror,
      publicClient,
      queueDispatch,
      switchChainAsync,
      wagmiConfig,
      writeContract,
    ],
  );

  const buy = useCallback(
    (target: GalleryArtworkTarget) => {
      if (activeAttempt.current) return;
      dispatch({ type: "reset" });
      const displayed = inputsRef.current.globalState;
      if (!displayed) {
        failOutsideQueue(
          "fulfillment",
          new Error(`The current ${config.token.symbol} price is unavailable.`),
        );
        return;
      }
      activeAttempt.current = {
        target,
        terms: null,
        displayedUnit: displayed.unit,
        displayedPremium: displayed.premium,
        paymentAsset: inputsRef.current.paymentAsset,
        checkoutQuote: inputsRef.current.checkoutQuote,
      };
      selectedTarget.current = target;
      setActiveArtworkKey(target.targetId);

      const latest = getConnection(wagmiConfig);
      if (!latest.address) {
        dispatch({ type: "connecting" });
        waitingForConnection.current = true;
        sawConnectModalOpen.current = false;
        connectModal.setOpen(true);
        return;
      }
      void executeAttempt();
    },
    [
      config.token.symbol,
      connectModal,
      executeAttempt,
      failOutsideQueue,
      wagmiConfig,
    ],
  );

  useEffect(() => {
    if (!waitingForConnection.current) return;
    if (connectModal.open) sawConnectModalOpen.current = true;
    if (connection.address) {
      waitingForConnection.current = false;
      sawConnectModalOpen.current = false;
      connectModal.setOpen(false);
      void executeAttempt();
      return;
    }
    if (sawConnectModalOpen.current && !connectModal.open) {
      failOutsideQueue("connection", connectionError(config.token.symbol));
    }
  }, [
    config.token.symbol,
    connectModal,
    connection.address,
    executeAttempt,
    failOutsideQueue,
  ]);

  useEffect(() => {
    if (shouldAutoCloseGalleryPurchaseModal(state.status)) {
      setTransactionModalOpen(false);
    }
  }, [state.status]);

  const transactions = useMemo(() => {
    const result: { kind: string; hash?: Hash }[] = [];
    const approvalSymbol =
      state.terms?.checkout?.paymentAsset ?? config.token.symbol;
    if (state.approvalHash) {
      result.push({
        kind: `${approvalSymbol} approval`,
        hash: state.approvalHash,
      });
    } else if (
      state.status === "awaiting_approval_wallet" ||
      state.status === "simulating_approval"
    ) {
      result.push({ kind: `${approvalSymbol} approval` });
    }
    if (state.purchaseHash) {
      result.push({ kind: "gallery purchase", hash: state.purchaseHash });
    } else if (
      state.status === "awaiting_purchase_wallet" ||
      state.status === "simulating_purchase"
    ) {
      result.push({ kind: "gallery purchase" });
    }
    return result;
  }, [
    config.token.symbol,
    state.approvalHash,
    state.purchaseHash,
    state.status,
    state.terms,
  ]);

  return {
    state,
    transactions,
    buy,
    modalOpen: transactionModalOpen,
    setModalOpen: setTransactionModalOpen,
    locked: activeArtworkKey !== null,
    activeArtworkKey,
    selectedTarget: selectedTarget.current,
  };
}
