import type { Address } from "viem";
import routeAssetManifest from "../../../../public/images/fame-swap/route-assets.json";

export type FameSwapRouteAssetStatus = "local" | "fallback";

export interface FameSwapRouteTokenAsset {
  address: Address;
  symbol: string;
  localImagePath: string | null;
  status: FameSwapRouteAssetStatus;
  source: string;
  retrievedDate: string | null;
  fileType: string | null;
  provenanceNote: string;
}

export interface FameSwapRouteTokenVisualAsset {
  imageSrc: string | null;
  imageAlt: string | null;
  imageStatus: FameSwapRouteAssetStatus;
  imageProvenance: string;
}

interface RouteAssetManifest {
  schemaVersion: number;
  runtimePolicy: string;
  onlineDiscoveryPerformed: boolean;
  tokens: FameSwapRouteTokenAsset[];
}

const manifest = routeAssetManifest as RouteAssetManifest;
const assetsByAddress = new Map(
  manifest.tokens.map((asset) => [asset.address.toLowerCase(), asset]),
);

export function fameSwapRouteAssetManifest(): RouteAssetManifest {
  return manifest;
}

export function routeAssetForAddress(
  address: Address,
): FameSwapRouteTokenAsset | null {
  return assetsByAddress.get(address.toLowerCase()) ?? null;
}

export function routeTokenVisualAssetForAddress(
  address: Address,
): FameSwapRouteTokenVisualAsset {
  const asset = routeAssetForAddress(address);
  if (asset?.localImagePath) {
    return {
      imageSrc: asset.localImagePath,
      imageAlt: `${asset.symbol} token logo`,
      imageStatus: "local",
      imageProvenance: asset.provenanceNote,
    };
  }

  return {
    imageSrc: null,
    imageAlt: null,
    imageStatus: "fallback",
    imageProvenance:
      asset?.provenanceNote ??
      "No reviewed route token image asset is available; use badge fallback.",
  };
}
