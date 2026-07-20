"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseAbiItem } from "viem";
import { usePublicClient } from "wagmi";
import {
  appendGalleryCatalogTargets,
  createGalleryCatalog,
  reconcileGalleryCatalogTargets,
} from "../catalog/catalogAssembler";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "../config/baseSepoliaTestGallery";
import { getBrowserGalleryCustodyHintStorage } from "../discovery/browserStorage";
import {
  discoverGalleryHoldings,
  revalidateGalleryHeldTokenIds,
  runInitialGalleryScan,
  type GalleryCustodyDiscoverySource,
} from "../discovery/discovery";
import type { GalleryQueryIdentity } from "../queryKeys";
import {
  readGalleryCustodyStates,
  readGalleryTokenStates,
  type GalleryMulticallClient,
} from "../reads";
import type { GalleryArtworkTarget } from "../types";

const config = BASE_SEPOLIA_TEST_GALLERY_CONFIG;
const identity: GalleryQueryIdentity = {
  chainId: config.chainId,
  manifestVersion: config.schemaVersion,
  marketplaceAddress: config.addresses.gallery,
  deploymentBlock: config.deployment.blockNumber,
};
const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
);
const deploymentKey = [
  identity.chainId,
  identity.manifestVersion,
  identity.marketplaceAddress.toLowerCase(),
  identity.deploymentBlock.toString(),
].join(":");

export function isCurrentGalleryScan(
  scanGeneration: number,
  currentGeneration: number,
) {
  return scanGeneration === currentGeneration;
}

function discoverySource(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
): GalleryCustodyDiscoverySource {
  const multicallClient = publicClient as unknown as GalleryMulticallClient;
  return {
    getBlockNumber: () => publicClient.getBlockNumber(),
    readCustodyStates: (tokenIds, blockNumber) =>
      readGalleryCustodyStates(multicallClient, blockNumber, tokenIds),
    readTokenStates: (tokenIds, blockNumber) =>
      readGalleryTokenStates(multicallClient, blockNumber, tokenIds),
    async getAffectedTokenIds(fromBlock, toBlock) {
      const logs = await publicClient.getLogs({
        address: config.addresses.mirror,
        event: transferEvent,
        fromBlock,
        toBlock,
        strict: true,
      });
      return logs.map(({ args }) => args.tokenId);
    },
  };
}

export function useGalleryDiscovery({
  poolTargets = [],
}: {
  poolTargets?: readonly GalleryArtworkTarget[];
} = {}) {
  const publicClient = usePublicClient({ chainId: config.chainId });
  const source = useMemo(
    () => (publicClient ? discoverySource(publicClient) : null),
    [publicClient],
  );
  const storage = useMemo(() => getBrowserGalleryCustodyHintStorage(), []);
  const [heldTargets, setHeldTargets] = useState<GalleryArtworkTarget[]>([]);
  const [isScanning, setIsScanning] = useState(Boolean(source));
  const [scanCompleted, setScanCompleted] = useState(false);
  const initialScan = useRef<ReturnType<typeof discoverGalleryHoldings> | null>(
    null,
  );
  const scanGeneration = useRef(0);

  useEffect(() => {
    if (!source) {
      setIsScanning(false);
      return;
    }
    let active = true;
    setIsScanning(true);
    const scanGenerationAtStart = scanGeneration.current;
    const scan = runInitialGalleryScan(deploymentKey, () =>
      discoverGalleryHoldings({
        source,
        marketplace: config.addresses.gallery,
        restoredHints: storage.restore(),
        persist: (record) => storage.commit(record),
        onTargets: (_kind, targets) => {
          if (
            !active ||
            !isCurrentGalleryScan(scanGenerationAtStart, scanGeneration.current)
          ) {
            return;
          }
          setHeldTargets((current) =>
            appendGalleryCatalogTargets(current, targets),
          );
        },
      }),
    );
    initialScan.current = scan;
    void scan.then((result) => {
      if (!active) return;
      if (isCurrentGalleryScan(scanGenerationAtStart, scanGeneration.current)) {
        setHeldTargets((current) =>
          reconcileGalleryCatalogTargets(current, result.targets),
        );
      }
      setScanCompleted(result.scanCompleted);
      setIsScanning(false);
      if (initialScan.current === scan) initialScan.current = null;
    });
    return () => {
      active = false;
    };
  }, [source, storage]);

  const revalidateAffectedTokenIds = useCallback(
    async (tokenIds: readonly bigint[]) => {
      if (!source) return [];
      const targets = await revalidateGalleryHeldTokenIds(source, tokenIds, {
        marketplace: config.addresses.gallery,
      });
      scanGeneration.current += 1;
      setHeldTargets((current) => {
        const affected = new Set(
          tokenIds.map((tokenId) => `held:${tokenId.toString()}`),
        );
        const retained = current.filter(
          ({ targetId }) => !affected.has(targetId),
        );
        return appendGalleryCatalogTargets(retained, targets);
      });
      return targets;
    },
    [source],
  );

  const getPendingInitialHeldTokenIds = useCallback(() => {
    const pendingInitialScan = initialScan.current;
    return pendingInitialScan
      ? pendingInitialScan.then((result) =>
          result.targets.map(({ tokenId }) => tokenId),
        )
      : null;
  }, []);

  const recoverHeldTokenIds = useCallback(async () => {
    if (!source) return [];
    const pendingInitialScan = getPendingInitialHeldTokenIds();
    if (pendingInitialScan) return pendingInitialScan;
    setIsScanning(true);
    try {
      const result = await discoverGalleryHoldings({
        source,
        marketplace: config.addresses.gallery,
        restoredHints: storage.restore(),
        persist: (record) => storage.commit(record),
      });
      setHeldTargets(result.targets);
      setScanCompleted(result.scanCompleted);
      return result.targets.map(({ tokenId }) => tokenId);
    } finally {
      setIsScanning(false);
    }
  }, [getPendingInitialHeldTokenIds, source, storage]);

  const catalog = useMemo(
    () =>
      appendGalleryCatalogTargets(
        createGalleryCatalog(poolTargets),
        heldTargets,
      ),
    [heldTargets, poolTargets],
  );

  return {
    catalog,
    heldTargets,
    isScanning,
    scanCompleted,
    revalidateAffectedTokenIds,
    getPendingInitialHeldTokenIds,
    recoverHeldTokenIds,
  };
}
