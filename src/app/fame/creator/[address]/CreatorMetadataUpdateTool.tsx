"use client";

import Image from "next/image";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useCallback, useEffect, useRef, useState } from "react";
import { isAddressEqual, type Hash } from "viem";
import { base } from "viem/chains";
import {
  useConnection,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import type {
  FameCreatorArtwork,
  FameCreatorCatalogPage,
} from "@/features/fame/creatorCatalog";
import { fameMetadataFailure } from "@/features/fame/metadata";
import { FAME_METADATA_FALLBACK_IMAGE } from "@/service/fameMetadata";
import { creatorArtistMagicAddress } from "@/features/fame/contract";
import {
  decodeCreatorPortalRoles,
  isReleasedCreatorUpdateToken,
} from "@/features/fame/creatorMetadata";
import { creatorArtistMagicAbi } from "@/wagmi";
import { SponsoredCreatorMetadataUploader } from "./SponsoredCreatorMetadataUploader";
import { useHasCreatorRole } from "./useHasCreatorRole";
import {
  createLatestRequestGuard,
  isUsableSubmittedMetadataRefresh,
  parsePendingMetadataUpdate,
  type PendingMetadataUpdate,
} from "./creatorMetadataUpdateState";
import {
  createTransactionSingleFlight,
  reconcileSubmittedTransaction,
} from "./submittedTransactionState";

type BrowseParam = Readonly<{
  cursor: number | null;
  blockNumber: string | null;
}>;

type UpdatePhase =
  | "idle"
  | "switching"
  | "preflighting"
  | "awaiting_signature"
  | "confirming"
  | "checking_receipt"
  | "refreshing"
  | "submitted_unknown"
  | "confirmed"
  | "confirmed_refresh_pending"
  | "error";

const queryKey = ["fame-creator-metadata-catalog"] as const;

function pendingUpdateStorageKey(address: string) {
  return `fame:creator:pending-metadata-update:${address.toLowerCase()}`;
}

async function fetchCatalogPage({
  cursor,
  blockNumber,
}: BrowseParam): Promise<FameCreatorCatalogPage> {
  const params = new URLSearchParams();
  if (cursor !== null) params.set("cursor", String(cursor));
  if (blockNumber !== null) params.set("blockNumber", blockNumber);
  const response = await fetch(`/api/fame/creator/catalog?${params}`, {
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error("Released artwork is temporarily unavailable.");
  return (await response.json()) as FameCreatorCatalogPage;
}

async function fetchExactArtwork(tokenId: number) {
  const response = await fetch(
    `/api/fame/creator/catalog?tokenId=${encodeURIComponent(String(tokenId))}`,
    { cache: "no-store" },
  );
  const body = (await response.json()) as
    | FameCreatorCatalogPage
    | { error?: string };
  if (!response.ok) {
    throw new Error(
      "error" in body && body.error
        ? body.error
        : "That released token could not be loaded.",
    );
  }
  const artwork = (body as FameCreatorCatalogPage).artworks[0];
  if (!artwork) throw new Error("That released token could not be loaded.");
  return artwork;
}

function updatePhaseLabel(phase: UpdatePhase) {
  switch (phase) {
    case "switching":
      return "Switching to Base…";
    case "preflighting":
      return "Checking role and released range…";
    case "awaiting_signature":
      return "Confirm update in wallet…";
    case "confirming":
      return "Confirming metadata update…";
    case "checking_receipt":
      return "Checking transaction…";
    case "refreshing":
      return "Refreshing updated artwork…";
    case "submitted_unknown":
      return "Check submitted transaction";
    default:
      return "Update metadata";
  }
}

function CreatorArtworkCard({
  artwork,
  onSelect,
}: {
  artwork: FameCreatorArtwork;
  onSelect?: (artwork: FameCreatorArtwork) => void;
}) {
  const ready = artwork.metadata.status === "ready";
  const imageUrl = ready
    ? artwork.metadata.image
    : FAME_METADATA_FALLBACK_IMAGE;
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [imageUrl]);
  const name =
    ready && artwork.metadata.name
      ? artwork.metadata.name
      : `FAME Society #${artwork.tokenId}`;
  const contents = (
    <>
      <div className="relative aspect-square overflow-hidden rounded bg-gray-950 ring-1 ring-gray-200">
        <Image
          src={imageFailed ? FAME_METADATA_FALLBACK_IMAGE : imageUrl}
          alt={`${name} current artwork`}
          fill
          sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition group-hover:scale-[1.02]"
          onError={() => setImageFailed(true)}
        />
        {!ready || imageFailed ? (
          <span className="absolute inset-x-2 bottom-2 rounded bg-black/75 px-2 py-1 text-xs text-white">
            Preview unavailable — still selectable
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="truncate text-sm font-medium">{name}</span>
        <span className="font-mono text-xs text-gray-500">
          #{artwork.tokenId}
        </span>
      </div>
    </>
  );
  return onSelect ? (
    <button
      type="button"
      onClick={() => onSelect(artwork)}
      className="group text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      aria-label={`Update metadata for token ${artwork.tokenId}`}
    >
      {contents}
    </button>
  ) : (
    <div>{contents}</div>
  );
}

export function CreatorMetadataUpdateTool({
  address,
}: {
  address: `0x${string}`;
}) {
  const roles = useHasCreatorRole(address);
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: base.id });
  const { mutateAsync: switchChain } = useSwitchChain();
  const { mutateAsync: writeContract } = useWriteContract();
  const queryClient = useQueryClient();
  const { ref: loadMoreRef, inView } = useInView({ rootMargin: "800px 0px" });
  const [selected, setSelected] = useState<FameCreatorArtwork | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupPending, setLookupPending] = useState(false);
  const [uploaderBusy, setUploaderBusy] = useState(false);
  const [metadataUrl, setMetadataUrl] = useState("");
  const [phase, setPhase] = useState<UpdatePhase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [submittedHash, setSubmittedHash] = useState<Hash | null>(null);
  const [submittedAt, setSubmittedAt] = useState<number | null>(null);
  const [reconciliationNow, setReconciliationNow] = useState(() => Date.now());
  const [uploaderResetKey, setUploaderResetKey] = useState(0);
  const [restoredPendingAccount, setRestoredPendingAccount] = useState<
    string | null
  >(null);
  const scrollPosition = useRef(0);
  const lookupRequests = useRef(createLatestRequestGuard()).current;
  const submitSingleFlight = useRef(createTransactionSingleFlight()).current;
  const checkSingleFlight = useRef(createTransactionSingleFlight()).current;
  const isConnectedAddress = Boolean(
    connection.address && isAddressEqual(connection.address, address),
  );

  const catalog = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }: { pageParam: BrowseParam }) =>
      fetchCatalogPage(pageParam),
    initialPageParam: {
      cursor: null,
      blockNumber: null,
    } satisfies BrowseParam,
    getNextPageParam: (lastPage) =>
      lastPage.nextCursor === null
        ? undefined
        : {
            cursor: lastPage.nextCursor,
            blockNumber: lastPage.blockNumber,
          },
    enabled: isConnectedAddress && roles.isCreator,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = catalog;

  useEffect(() => {
    if (
      !inView ||
      !hasNextPage ||
      isFetchingNextPage ||
      isFetchNextPageError ||
      selected
    ) {
      return;
    }
    void fetchNextPage();
  }, [
    fetchNextPage,
    hasNextPage,
    inView,
    isFetchNextPageError,
    isFetchingNextPage,
    selected,
  ]);

  useEffect(() => {
    if (isConnectedAddress) return;
    lookupRequests.invalidate();
    setSelected(null);
    setMetadataUrl("");
    setSubmittedHash(null);
    setSubmittedAt(null);
    setPhase("idle");
    setMessage(null);
    setUploaderBusy(false);
    setRestoredPendingAccount(null);
  }, [isConnectedAddress, lookupRequests]);

  const selectArtwork = useCallback(
    (artwork: FameCreatorArtwork) => {
      lookupRequests.invalidate();
      scrollPosition.current = window.scrollY;
      setSelected(artwork);
      setMetadataUrl("");
      setSubmittedHash(null);
      setPhase("idle");
      setMessage(null);
      setLookupError(null);
    },
    [lookupRequests],
  );

  const clearPendingUpdate = useCallback(() => {
    try {
      sessionStorage.removeItem(pendingUpdateStorageKey(address));
    } catch {
      // Current component state still prevents a duplicate submission.
    }
  }, [address]);

  useEffect(() => {
    if (!isConnectedAddress || !roles.isCreator || !connection.address) return;
    const account = connection.address.toLowerCase();
    if (restoredPendingAccount === account) return;
    let cancelled = false;
    let pending: PendingMetadataUpdate | null = null;
    try {
      pending = parsePendingMetadataUpdate(
        sessionStorage.getItem(pendingUpdateStorageKey(address)),
        connection.address,
      );
    } catch {
      // Treat unavailable session storage as having no restorable transaction.
    }
    if (!pending) {
      setRestoredPendingAccount(account);
      return;
    }
    void fetchExactArtwork(pending.tokenId)
      .catch(
        (): FameCreatorArtwork => ({
          tokenId: pending.tokenId,
          revision: null,
          metadata: fameMetadataFailure("Token metadata could not be loaded"),
        }),
      )
      .then((artwork) => {
        if (cancelled) return;
        setSelected(artwork);
        setMetadataUrl(pending.metadataUrl);
        setSubmittedHash(pending.hash);
        setSubmittedAt(pending.submittedAt);
        setPhase("submitted_unknown");
        setReconciliationNow(Date.now());
        setMessage(
          `Transaction ${pending.hash} was submitted earlier. Check it before attempting another update.`,
        );
        setRestoredPendingAccount(account);
      });
    return () => {
      cancelled = true;
    };
  }, [
    address,
    connection.address,
    isConnectedAddress,
    restoredPendingAccount,
    roles.isCreator,
  ]);

  const lookupToken = async () => {
    setLookupError(null);
    if (!/^[1-9]\d*$/.test(tokenInput)) {
      setLookupError("Enter a released whole-number token ID.");
      return;
    }
    const tokenId = Number(tokenInput);
    if (!Number.isSafeInteger(tokenId)) {
      setLookupError("Enter a valid released token ID.");
      return;
    }
    const requestId = lookupRequests.begin();
    setLookupPending(true);
    try {
      const artwork = await fetchExactArtwork(tokenId);
      if (lookupRequests.isCurrent(requestId)) {
        setLookupPending(false);
        selectArtwork(artwork);
      }
    } catch (error) {
      if (lookupRequests.isCurrent(requestId)) {
        setLookupError(
          error instanceof Error
            ? error.message
            : "That token could not be loaded.",
        );
      }
    } finally {
      if (lookupRequests.isCurrent(requestId)) setLookupPending(false);
    }
  };

  const patchCatalogArtwork = useCallback(
    (artwork: FameCreatorArtwork) => {
      queryClient.setQueryData<{
        pages: FameCreatorCatalogPage[];
        pageParams: BrowseParam[];
      }>(queryKey, (current) =>
        current
          ? {
              ...current,
              pages: current.pages.map((page) => ({
                ...page,
                artworks: page.artworks.map((candidate) =>
                  candidate.tokenId === artwork.tokenId ? artwork : candidate,
                ),
              })),
            }
          : current,
      );
    },
    [queryClient],
  );

  const completeConfirmedUpdate = useCallback(
    async (expectedMetadataUrl: string) => {
      if (!selected) return;
      clearPendingUpdate();
      setPhase("refreshing");
      try {
        const refreshed = await fetchExactArtwork(selected.tokenId);
        if (!isUsableSubmittedMetadataRefresh(refreshed, expectedMetadataUrl)) {
          setPhase("confirmed_refresh_pending");
          setMessage(
            `Society #${selected.tokenId} was updated on Base, but the new preview could not be loaded.`,
          );
          return;
        }
        patchCatalogArtwork(refreshed);
        setSelected(refreshed);
        setPhase("confirmed");
        setMessage(
          `Society #${selected.tokenId} metadata was updated on Base.`,
        );
      } catch {
        setPhase("confirmed_refresh_pending");
        setMessage(
          `Society #${selected.tokenId} was updated on Base, but the new preview could not be loaded.`,
        );
      }
    },
    [clearPendingUpdate, patchCatalogArtwork, selected],
  );

  const reconcileSubmitted = useCallback(async () => {
    if (!submittedHash || !publicClient) return "unknown" as const;
    return reconcileSubmittedTransaction(
      async () =>
        (await publicClient.getTransactionReceipt({ hash: submittedHash }))
          .status,
    );
  }, [publicClient, submittedHash]);

  const checkSubmitted = async () => {
    await checkSingleFlight(async () => {
      setPhase("checking_receipt");
      const status = await reconcileSubmitted();
      if (status === "success") {
        await completeConfirmedUpdate(metadataUrl.trim());
      } else if (status === "reverted") {
        clearPendingUpdate();
        setSubmittedHash(null);
        setSubmittedAt(null);
        setPhase("error");
        setMessage(
          "The metadata update transaction reverted. You can try again.",
        );
      } else {
        setPhase("submitted_unknown");
        setReconciliationNow(Date.now());
        setMessage(
          `Transaction ${submittedHash} was submitted, but its receipt is still unavailable. Do not submit a duplicate update.`,
        );
      }
    });
  };

  const submit = () =>
    submitSingleFlight(async () => {
      if (
        !selected ||
        !metadataUrl.trim() ||
        !publicClient ||
        !connection.address
      ) {
        return;
      }
      let hash: Hash | null = null;
      setMessage(null);
      try {
        if (connection.chainId !== base.id) {
          setPhase("switching");
          await switchChain({ chainId: base.id });
        }
        setPhase("preflighting");
        const blockNumber = await publicClient.getBlockNumber();
        const [roleResult, boundaryResult] = await publicClient.multicall({
          allowFailure: true,
          blockNumber,
          contracts: [
            {
              address: creatorArtistMagicAddress(base.id),
              abi: creatorArtistMagicAbi,
              functionName: "rolesOf",
              args: [connection.address],
            },
            {
              address: creatorArtistMagicAddress(base.id),
              abi: creatorArtistMagicAbi,
              functionName: "nextTokenId",
            },
          ],
        });
        if (
          roleResult.status !== "success" ||
          boundaryResult.status !== "success" ||
          typeof roleResult.result !== "bigint" ||
          typeof boundaryResult.result !== "number"
        ) {
          throw new Error("Creator role or released range is unavailable.");
        }
        if (!decodeCreatorPortalRoles(roleResult.result).isCreator) {
          throw new Error("This wallet no longer has the CREATOR role.");
        }
        if (
          !isReleasedCreatorUpdateToken(selected.tokenId, boundaryResult.result)
        ) {
          throw new Error("This token is outside the current released range.");
        }

        const simulation = await publicClient.simulateContract({
          account: connection.address,
          address: creatorArtistMagicAddress(base.id),
          abi: creatorArtistMagicAbi,
          functionName: "updateMetadata",
          args: [BigInt(selected.tokenId), metadataUrl.trim()],
        });
        setPhase("awaiting_signature");
        hash = await writeContract(simulation.request);
        const submissionTime = Date.now();
        setSubmittedHash(hash);
        setSubmittedAt(submissionTime);
        try {
          sessionStorage.setItem(
            pendingUpdateStorageKey(address),
            JSON.stringify({
              account: connection.address,
              tokenId: selected.tokenId,
              metadataUrl: metadataUrl.trim(),
              hash,
              submittedAt: submissionTime,
            }),
          );
        } catch {
          // Current component state still prevents a duplicate submission.
        }
        setPhase("confirming");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") {
          throw new Error("The metadata update transaction reverted.");
        }
        await completeConfirmedUpdate(metadataUrl.trim());
      } catch (error) {
        if (hash) {
          const submitted = hash;
          const status = await reconcileSubmittedTransaction(
            async () =>
              (await publicClient.getTransactionReceipt({ hash: submitted }))
                .status,
          );
          if (status === "success") {
            await completeConfirmedUpdate(metadataUrl.trim());
            return;
          }
          if (status === "unknown") {
            setPhase("submitted_unknown");
            setMessage(
              `Transaction ${hash} was submitted, but its receipt could not be confirmed. Do not submit a duplicate update.`,
            );
            return;
          }
          clearPendingUpdate();
          setSubmittedHash(null);
          setSubmittedAt(null);
        }
        setPhase("error");
        setMessage(
          error instanceof Error ? error.message : "Metadata update failed.",
        );
      }
    });

  const updateAnother = () => {
    setSelected(null);
    setMetadataUrl("");
    setSubmittedHash(null);
    setSubmittedAt(null);
    setPhase("idle");
    setMessage(null);
    setUploaderBusy(false);
    setUploaderResetKey((key) => key + 1);
    requestAnimationFrame(() =>
      window.scrollTo({ top: scrollPosition.current }),
    );
  };

  const clearVerifiedDroppedUpdate = () => {
    clearPendingUpdate();
    setSubmittedHash(null);
    setSubmittedAt(null);
    setPhase("idle");
    setMessage(
      "Pending transaction record cleared. Submit again only if BaseScan confirms the earlier transaction was dropped.",
    );
  };

  if (!isConnectedAddress || roles.isLoading || roles.isPending) {
    return null;
  }

  if (roles.isError) {
    return (
      <section className="rounded-lg border border-red-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-center text-red-700" role="alert">
          The CREATOR role could not be checked. {roles.errorMessage}
        </p>
        <div className="mt-4 text-center">
          <button
            type="button"
            className="rounded border border-indigo-600 px-4 py-2 text-indigo-700"
            onClick={() => void roles.refetch()}
          >
            Retry role check
          </button>
        </div>
      </section>
    );
  }

  if (!roles.isCreator) return null;

  if (restoredPendingAccount !== address.toLowerCase()) {
    return (
      <section className="rounded-lg border border-indigo-200 bg-white p-5 shadow-sm sm:p-7">
        <p role="status" className="text-center text-gray-600">
          Checking for a previously submitted metadata update…
        </p>
      </section>
    );
  }

  const pages = catalog.data?.pages ?? [];
  const artworks = pages.flatMap(({ artworks: pageArtworks }) => pageArtworks);
  const transactionBusy = [
    "switching",
    "preflighting",
    "awaiting_signature",
    "confirming",
    "checking_receipt",
    "refreshing",
    "submitted_unknown",
  ].includes(phase);
  const busy = transactionBusy || uploaderBusy;
  const confirmed =
    phase === "confirmed" || phase === "confirmed_refresh_pending";
  const canClearPending =
    phase === "submitted_unknown" &&
    submittedAt !== null &&
    reconciliationNow - submittedAt >= 15 * 60 * 1000;

  return (
    <section className="rounded-lg border border-indigo-200 bg-white p-5 shadow-sm sm:p-7">
      <h1 className="text-3xl font-bold">Update released artwork</h1>
      <p className="mt-2 text-gray-600">
        Replace metadata for any released Society token without changing its
        ownership or pool position.
      </p>

      {selected ? (
        <div className="mt-6 space-y-5">
          <button
            type="button"
            className="text-sm font-medium text-indigo-700 hover:text-indigo-900"
            onClick={updateAnother}
            disabled={busy && !confirmed}
          >
            ← Back to released artwork
          </button>
          <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
            <div>
              <CreatorArtworkCard artwork={selected} />
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="creator-update-metadata-url"
                  className="block text-sm font-medium"
                >
                  New metadata URL
                </label>
                <input
                  id="creator-update-metadata-url"
                  type="url"
                  value={metadataUrl}
                  onChange={(event) => setMetadataUrl(event.target.value)}
                  placeholder="https://example.com/metadata.json"
                  disabled={busy || confirmed}
                  className="mt-2 w-full rounded border border-gray-300 p-3"
                />
              </div>
              {!confirmed ? (
                <SponsoredCreatorMetadataUploader
                  resetKey={uploaderResetKey}
                  address={address}
                  tokenId={selected.tokenId}
                  mode="update"
                  onComplete={({ metadataUri }) => setMetadataUrl(metadataUri)}
                  onBusyChange={setUploaderBusy}
                />
              ) : null}
              <button
                type="button"
                onClick={() =>
                  phase === "submitted_unknown"
                    ? void checkSubmitted()
                    : void submit()
                }
                disabled={
                  !metadataUrl.trim() ||
                  (busy && phase !== "submitted_unknown") ||
                  confirmed
                }
                className="rounded bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {updatePhaseLabel(phase)}
              </button>
              {message ? (
                <p
                  role="status"
                  className={
                    phase === "error"
                      ? "rounded bg-red-50 p-3 text-sm text-red-700"
                      : phase === "submitted_unknown" ||
                          phase === "confirmed_refresh_pending"
                        ? "rounded bg-amber-50 p-3 text-sm text-amber-800"
                        : "rounded bg-green-50 p-3 text-sm text-green-800"
                  }
                >
                  {message}
                </p>
              ) : null}
              {submittedHash && phase === "submitted_unknown" ? (
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`https://basescan.org/tx/${submittedHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-indigo-700 underline"
                  >
                    View transaction on BaseScan
                  </a>
                  {canClearPending ? (
                    <button
                      type="button"
                      onClick={clearVerifiedDroppedUpdate}
                      className="rounded border border-amber-700 px-3 py-2 text-sm font-medium text-amber-800"
                    >
                      I verified it was dropped — clear record
                    </button>
                  ) : null}
                </div>
              ) : null}
              {phase === "confirmed_refresh_pending" ? (
                <button
                  type="button"
                  onClick={() =>
                    void completeConfirmedUpdate(metadataUrl.trim())
                  }
                  className="rounded border border-amber-700 px-5 py-3 font-semibold text-amber-800 hover:bg-amber-50"
                >
                  Retry updated preview
                </button>
              ) : null}
              {confirmed ? (
                <button
                  type="button"
                  onClick={updateAnother}
                  className="rounded border border-indigo-600 px-5 py-3 font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  Update another token
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="creator-token-id"
                className="block text-sm font-medium"
              >
                Go directly to token ID
              </label>
              <input
                id="creator-token-id"
                inputMode="numeric"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void lookupToken();
                }}
                placeholder="646"
                className="mt-2 w-full rounded border border-gray-300 p-3"
              />
            </div>
            <button
              type="button"
              onClick={() => void lookupToken()}
              disabled={lookupPending}
              className="rounded bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {lookupPending ? "Loading…" : "Find token"}
            </button>
          </div>
          {lookupError ? (
            <p className="mt-2 text-sm text-red-700" role="alert">
              {lookupError}
            </p>
          ) : null}

          {catalog.isPending ? (
            <p className="py-10 text-center" role="status">
              Loading released artwork…
            </p>
          ) : catalog.isError ? (
            <div className="py-10 text-center">
              <p className="text-red-700">
                Released artwork could not be loaded.
              </p>
              <button
                type="button"
                className="mt-4 rounded border border-indigo-600 px-4 py-2 text-indigo-700"
                onClick={() => void catalog.refetch()}
              >
                Try again
              </button>
            </div>
          ) : artworks.length === 0 ? (
            <p className="py-10 text-center text-gray-600">
              No released artwork is available.
            </p>
          ) : (
            <>
              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                {artworks.map((artwork) => (
                  <CreatorArtworkCard
                    key={artwork.tokenId}
                    artwork={artwork}
                    onSelect={selectArtwork}
                  />
                ))}
              </div>
              {catalog.hasNextPage || catalog.isFetchNextPageError ? (
                <div
                  ref={loadMoreRef}
                  className="flex min-h-24 items-center justify-center py-8 text-sm text-gray-600"
                >
                  {catalog.isFetchNextPageError ? (
                    <button
                      type="button"
                      className="rounded border border-indigo-600 px-4 py-2 text-indigo-700"
                      onClick={() => void catalog.fetchNextPage()}
                    >
                      Retry loading artwork
                    </button>
                  ) : catalog.isFetchingNextPage ? (
                    "Loading more artwork…"
                  ) : (
                    "Load more artwork"
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </section>
  );
}
