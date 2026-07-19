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
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
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
import { verifyGalleryPurchase } from "../transactions/verifyPurchase";
import type {
  GalleryArtworkTarget,
  GalleryFrozenBuyerTerms,
  GalleryGlobalState,
  GalleryVerifiedAcquisition,
} from "../types";

const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;
const marketplace = config.addresses.gallery;
const fame = config.addresses.fame;
const mirror = config.addresses.mirror;
const creatorMagic = config.addresses.creatorMagic;

type GalleryPurchaseInputs = {
  globalState: GalleryGlobalState | null;
  catalog: readonly GalleryArtworkTarget[];
  heldTargets: readonly GalleryArtworkTarget[];
  refreshGlobal: () => Promise<void>;
  refreshPool: () => Promise<void>;
  revalidateAffectedTokenIds: (
    tokenIds: readonly bigint[],
  ) => Promise<readonly GalleryArtworkTarget[]>;
  recoverHeldTokenIds: () => Promise<readonly bigint[]>;
};

type ActiveAttempt = {
  target: GalleryArtworkTarget;
  terms: GalleryFrozenBuyerTerms | null;
  displayedUnit: bigint;
  displayedPremium: bigint;
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

function unavailableClientError() {
  return new Error("Base Sepolia RPC client is unavailable.");
}

function connectionError() {
  return new Error("Connect a wallet to buy with TEST.");
}

export function logGalleryPurchaseError(
  stage: GalleryPurchaseErrorStage,
  cause: unknown,
) {
  console.error(`[TEST gallery purchase:${stage}]`, cause);
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
    async (allowShellRecovery: boolean) => {
      const attempt = activeAttempt.current;
      if (!attempt) return;
      if (!publicClient) {
        failOutsideQueue("connection", unavailableClientError());
        return;
      }

      setTransactionModalOpen(true);
      let outerStage: GalleryPurchaseErrorStage = "connection";
      try {
        let latestConnection = getConnection(wagmiConfig);
        if (!latestConnection.address) {
          failOutsideQueue("connection", connectionError());
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
            new Error("Switch to Base Sepolia to continue."),
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

        const terms =
          attempt.terms ??
          freezeGalleryBuyerTerms({
            account: latestConnection.address,
            selectedTarget: {
              targetId: attempt.target.targetId,
              tokenId: attempt.target.tokenId,
            },
            artworkHash: attempt.target.artworkHash,
            unit: attempt.displayedUnit,
            displayedPremium: attempt.displayedPremium,
          });
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

        await executeGalleryPurchase({
          terms,
          allowShellRecovery,
          dependencies: {
            dispatch: queueDispatch,
            readAllowance: (frozen) =>
              publicClient.readContract({
                abi: fameAbi,
                address: fame,
                functionName: "allowance",
                args: [frozen.account, marketplace],
              }),
            async simulateApproval(frozen) {
              const simulation = await publicClient.simulateContract(
                galleryApprovalContractRequest(frozen),
              );
              return { request: simulation.request };
            },
            writeApproval: (request) =>
              writeContract(request as ExactWagmiWriteRequest),
            async resolveFulfillment({
              terms: frozen,
              allowShellRecovery: recover,
            }) {
              const latest = inputsRef.current;
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
                  : undefined,
              });
              return { route: resolved };
            },
            async simulatePurchase(frozen, route) {
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
            verifyPurchase: ({ receipt, hash, terms: frozen, route }) =>
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
          new Error("The current TEST price is unavailable."),
        );
        return;
      }
      activeAttempt.current = {
        target,
        terms: null,
        displayedUnit: displayed.unit,
        displayedPremium: displayed.premium,
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
      void executeAttempt(false);
    },
    [connectModal, executeAttempt, failOutsideQueue, wagmiConfig],
  );

  useEffect(() => {
    if (!waitingForConnection.current) return;
    if (connectModal.open) sawConnectModalOpen.current = true;
    if (connection.address) {
      waitingForConnection.current = false;
      sawConnectModalOpen.current = false;
      connectModal.setOpen(false);
      void executeAttempt(false);
      return;
    }
    if (sawConnectModalOpen.current && !connectModal.open) {
      failOutsideQueue("connection", connectionError());
    }
  }, [connectModal, connection.address, executeAttempt, failOutsideQueue]);

  useEffect(() => {
    if (shouldAutoCloseGalleryPurchaseModal(state.status)) {
      setTransactionModalOpen(false);
    }
  }, [state.status]);

  const retry = useCallback(() => {
    if (state.purchaseHash) return;
    const target =
      activeAttempt.current?.target ??
      selectedTarget.current ??
      inputsRef.current.catalog.find(
        ({ targetId }) => targetId === state.terms?.selectedTarget.targetId,
      );
    if (!target || activeAttempt.current) return;
    const displayed = inputsRef.current.globalState;
    if (!displayed && !state.terms) return;
    activeAttempt.current = {
      target,
      terms: state.terms,
      displayedUnit: state.terms?.unit ?? displayed!.unit,
      displayedPremium: state.terms?.maxPremium ?? displayed!.premium,
    };
    setActiveArtworkKey(target.targetId);
    void executeAttempt(true);
  }, [executeAttempt, state.purchaseHash, state.terms]);

  const transactions = useMemo(() => {
    const result: { kind: string; hash?: Hash }[] = [];
    if (state.approvalHash) {
      result.push({ kind: "TEST approval", hash: state.approvalHash });
    } else if (
      state.status === "awaiting_approval_wallet" ||
      state.status === "simulating_approval"
    ) {
      result.push({ kind: "TEST approval" });
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
  }, [state.approvalHash, state.purchaseHash, state.status]);

  return {
    state,
    transactions,
    buy,
    retry,
    modalOpen: transactionModalOpen,
    setModalOpen: setTransactionModalOpen,
    locked: activeArtworkKey !== null,
    activeArtworkKey,
    selectedTarget: selectedTarget.current,
  };
}
