import { isAddressEqual, type Address, type Hash } from "viem";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import type {
  GalleryFrozenBuyerTerms,
  GalleryFulfillmentRoute,
} from "../types";

const marketplace = BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery;

export type GalleryFulfillmentTokenState = Readonly<{
  owner: Address;
  artworkHash: Hash;
  inArtPool: boolean;
  inMintPool: boolean;
  inBurnPool: boolean;
}>;

export type GalleryFulfillmentReadSource = {
  captureBlockNumber: () => Promise<bigint>;
  readPremium: (blockNumber: bigint) => Promise<bigint>;
  readTokenState: (
    tokenId: bigint,
    blockNumber: bigint,
  ) => Promise<GalleryFulfillmentTokenState>;
  readShellOwner: (tokenId: bigint, blockNumber: bigint) => Promise<Address>;
};

type FreezeGalleryBuyerTermsInput = {
  account: Address;
  selectedTarget: {
    targetId: string;
    tokenId: bigint;
  };
  artworkHash: Hash;
  unit: bigint;
  displayedPremium: bigint;
};

export function freezeGalleryBuyerTerms(
  {
    account,
    selectedTarget,
    artworkHash,
    unit,
    displayedPremium,
  }: FreezeGalleryBuyerTermsInput,
  runtime: {
    chainId: number;
    marketplace: Address;
  } = {
    chainId: BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId,
    marketplace,
  },
): GalleryFrozenBuyerTerms {
  return Object.freeze({
    chainId: runtime.chainId,
    account,
    recipient: account,
    selectedTarget: Object.freeze({ ...selectedTarget }),
    artworkHash,
    unit,
    maxPremium: displayedPremium,
    maximumSpend: unit + displayedPremium,
    allowanceTarget: runtime.marketplace,
  });
}

function uniqueTokenIds(values: readonly bigint[]) {
  return [...new Set(values)];
}

function unavailableArtwork() {
  return new Error("This artwork is no longer available.");
}

function ineligibleArtwork() {
  return new Error("This artwork is not eligible for purchase.");
}

function unavailableShell() {
  return new Error("The gallery has no available delivery shell.");
}

function priceChanged() {
  return new Error("The gallery price changed. Choose Buy again to continue.");
}

type CanonicalCandidate = {
  tokenId: bigint;
  state: GalleryFulfillmentTokenState;
};

async function readCanonicalCandidates(
  source: GalleryFulfillmentReadSource,
  tokenIds: readonly bigint[],
  blockNumber: bigint,
) {
  return Promise.all(
    tokenIds.map(
      async (tokenId): Promise<CanonicalCandidate> => ({
        tokenId,
        state: await source.readTokenState(tokenId, blockNumber),
      }),
    ),
  );
}

function heldRoute(
  terms: GalleryFrozenBuyerTerms,
  candidates: readonly CanonicalCandidate[],
  marketplaceAddress: Address,
): GalleryFulfillmentRoute | null {
  const candidate = candidates.find(
    ({ state }) =>
      state.artworkHash === terms.artworkHash &&
      isAddressEqual(state.owner, marketplaceAddress),
  );
  return candidate
    ? Object.freeze({ kind: "held" as const, shellId: candidate.tokenId })
    : null;
}

function poolCandidates(
  terms: GalleryFrozenBuyerTerms,
  candidates: readonly CanonicalCandidate[],
) {
  return candidates.flatMap(({ tokenId, state }) => {
    if (state.artworkHash !== terms.artworkHash || state.inArtPool) return [];
    if (state.inMintPool === state.inBurnPool) return [];
    return [
      {
        tokenId,
        poolKind: state.inMintPool ? ("mint" as const) : ("burn" as const),
      },
    ];
  });
}

async function verifiedShell(
  source: GalleryFulfillmentReadSource,
  shellTokenIds: readonly bigint[],
  sourceId: bigint,
  blockNumber: bigint,
  marketplaceAddress: Address,
) {
  for (const shellId of uniqueTokenIds(shellTokenIds)) {
    if (shellId === sourceId) continue;
    const owner = await source.readShellOwner(shellId, blockNumber);
    if (isAddressEqual(owner, marketplaceAddress)) return shellId;
  }
  return null;
}

type ResolutionAttempt =
  | {
      status: "resolved";
      route: GalleryFulfillmentRoute;
      currentPremium: bigint;
      resolutionBlock: bigint;
    }
  | {
      status: "shell_exhausted";
    }
  | {
      status: "artwork_unavailable";
    }
  | {
      status: "artwork_ineligible";
    };

async function resolveAtCurrentBlock({
  terms,
  candidateTokenIds,
  shellTokenIds,
  source,
}: {
  terms: GalleryFrozenBuyerTerms;
  candidateTokenIds: readonly bigint[];
  shellTokenIds: readonly bigint[];
  source: GalleryFulfillmentReadSource;
}): Promise<ResolutionAttempt> {
  const resolutionBlock = await source.captureBlockNumber();
  const allCandidateIds = uniqueTokenIds([
    terms.selectedTarget.tokenId,
    ...candidateTokenIds,
  ]);
  const [currentPremium, candidates] = await Promise.all([
    source.readPremium(resolutionBlock),
    readCanonicalCandidates(source, allCandidateIds, resolutionBlock),
  ]);

  if (currentPremium > terms.maxPremium) throw priceChanged();

  const currentHeldRoute = heldRoute(terms, candidates, terms.allowanceTarget);
  if (currentHeldRoute) {
    return {
      status: "resolved",
      route: currentHeldRoute,
      currentPremium,
      resolutionBlock,
    };
  }

  const currentPoolCandidates = poolCandidates(terms, candidates);
  for (const candidate of currentPoolCandidates) {
    const shellId = await verifiedShell(
      source,
      shellTokenIds,
      candidate.tokenId,
      resolutionBlock,
      terms.allowanceTarget,
    );
    if (shellId !== null) {
      return {
        status: "resolved",
        route: Object.freeze({
          kind: "pool" as const,
          poolKind: candidate.poolKind,
          shellId,
          sourceId: candidate.tokenId,
        }),
        currentPremium,
        resolutionBlock,
      };
    }
  }

  if (currentPoolCandidates.length > 0) return { status: "shell_exhausted" };

  const matchingArtwork = candidates.filter(
    ({ state }) => state.artworkHash === terms.artworkHash,
  );
  return matchingArtwork.length === 0
    ? { status: "artwork_unavailable" }
    : { status: "artwork_ineligible" };
}

function throwUnresolvedResolution(
  resolution: Exclude<ResolutionAttempt, { status: "resolved" }>,
): never {
  if (resolution.status === "shell_exhausted") throw unavailableShell();
  if (resolution.status === "artwork_unavailable") throw unavailableArtwork();
  throw ineligibleArtwork();
}

export async function resolveGalleryFulfillment({
  terms,
  candidateTokenIds,
  knownShellTokenIds,
  source,
  refreshShellTokenIds,
}: {
  terms: GalleryFrozenBuyerTerms;
  candidateTokenIds: readonly bigint[];
  knownShellTokenIds: readonly bigint[];
  source: GalleryFulfillmentReadSource;
  /**
   * Supplied only for a caller-authorized stale-shell recovery. The callback
   * owns the bounded custody refresh; this resolver invokes it at most once.
   */
  refreshShellTokenIds?: () => Promise<readonly bigint[]>;
}) {
  let resolution = await resolveAtCurrentBlock({
    terms,
    candidateTokenIds,
    shellTokenIds: knownShellTokenIds,
    source,
  });

  if (resolution.status !== "resolved" && refreshShellTokenIds) {
    const refreshedShellIds = await refreshShellTokenIds();
    resolution = await resolveAtCurrentBlock({
      terms,
      candidateTokenIds: uniqueTokenIds([
        ...candidateTokenIds,
        ...refreshedShellIds,
      ]),
      shellTokenIds: refreshedShellIds,
      source,
    });
  }

  if (resolution.status !== "resolved") {
    throwUnresolvedResolution(resolution);
  }

  return resolution.route;
}
