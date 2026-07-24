"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseAbiItem } from "viem";
import { usePublicClient } from "wagmi";
import {
  appendGalleryCatalogTargets,
  createGalleryCatalog,
  reconcileGalleryCatalogTargets,
} from "../catalog/catalogAssembler";
import { useGalleryRuntime } from "../config/galleryRuntime";
import { getBrowserGalleryCustodyHintStorage } from "../discovery/browserStorage";
import { createGalleryCustodyCacheIdentity } from "../discovery/cache";
import {
  discoverGalleryHoldings,
  revalidateGalleryHeldTokenIds,
  runInitialGalleryScan,
  type GalleryCustodyDiscoverySource,
} from "../discovery/discovery";
import type { GalleryQueryIdentity } from "../queryKeys";
import {
  galleryReadAddresses,
  readGalleryCustodyStates,
  readGalleryTokenStates,
  type GalleryMulticallClient,
} from "../reads";
import type { GalleryArtworkTarget } from "../types";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
);

export function isCurrentGalleryScan(
  scanGeneration: number,
  currentGeneration: number,
) {
  return scanGeneration === currentGeneration;
}

function discoverySource(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  config: ReturnType<typeof useGalleryRuntime>,
): GalleryCustodyDiscoverySource {
  const multicallClient = publicClient as unknown as GalleryMulticallClient;
  const addresses = galleryReadAddresses(config.addresses);
  return {
    getBlockNumber: () => publicClient.getBlockNumber(),
    readCustodyStates: (tokenIds, blockNumber) =>
      readGalleryCustodyStates(
        multicallClient,
        blockNumber,
        tokenIds,
        addresses,
      ),
    readTokenStates: (tokenIds, blockNumber) =>
      readGalleryTokenStates(multicallClient, blockNumber, tokenIds, addresses),
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
  const config = useGalleryRuntime();
  const marketplace = config.addresses.gallery;
  const identity = useMemo<GalleryQueryIdentity>(
    () => ({
      chainId: config.chainId,
      manifestVersion: config.schemaVersion,
      marketplaceAddress: config.addresses.gallery,
      deploymentBlock: config.deployment.blockNumber,
    }),
    [config],
  );
  const deploymentKey = [
    identity.chainId,
    identity.manifestVersion,
    identity.marketplaceAddress.toLowerCase(),
    identity.deploymentBlock.toString(),
  ].join(":");
  const publicClient = usePublicClient({ chainId: config.chainId });
  const source = useMemo(
    () => (publicClient ? discoverySource(publicClient, config) : null),
    [config, publicClient],
  );
  const storage = useMemo(
    () =>
      getBrowserGalleryCustodyHintStorage(
        createGalleryCustodyCacheIdentity(identity, {
          firstTokenId: BigInt(config.collection.firstTokenId),
          lastTokenId: BigInt(config.collection.lastTokenId),
        }),
      ),
    [config, identity],
  );
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
        marketplace,
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
  }, [deploymentKey, marketplace, source, storage]);

  const revalidateAffectedTokenIds = useCallback(
    async (tokenIds: readonly bigint[]) => {
      if (!source) return [];
      const targets = await revalidateGalleryHeldTokenIds(source, tokenIds, {
        marketplace,
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
    [marketplace, source],
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
        marketplace,
        restoredHints: storage.restore(),
        persist: (record) => storage.commit(record),
      });
      setHeldTargets(result.targets);
      setScanCompleted(result.scanCompleted);
      return result.targets.map(({ tokenId }) => tokenId);
    } finally {
      setIsScanning(false);
    }
  }, [getPendingInitialHeldTokenIds, marketplace, source, storage]);

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
