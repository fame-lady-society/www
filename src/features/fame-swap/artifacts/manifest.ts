import type { Hex } from "viem";

export const FAME_SWAP_ARTIFACT_MANIFEST = {
  sourceRepo: "../fame-contracts",
  sourceBranch: "feat/fame-multi-leg-router",
  sourceCommit: "c4a056952a3d0f0f55ead6e6d6b2f4b3e48844ab",
  schemaVersion: 1,
  pinnedBaseBlock: 45_884_844,
  solverRoutesJsonHash:
    "0x44cd1807a871080e02630714058ccd2545746712c9b382ffe4411223feeaf218" as Hex,
  solverRoutesContentHash:
    "0x053806dd44f7bf3751a0675b628dd4558a155a9608e8635f8cbdb180c48041a8" as Hex,
  gapMatrixJsonHash:
    "0xe12b694540180d42f640c9b660379eab7e38caef92f24e22c629f6b6da4c427e" as Hex,
  gapMatrixContentHash:
    "0xb3d7a0f5f3a10368c5501ac0deb4e8bca4cfebb10749f79ee7cd7ee24a6cb11e" as Hex,
  parityVectorsJsonHash:
    "0xf9a0cfbddc5ad9a5a2507c490f592ec72ba111e48d3ec0ea8612f69e35998aee" as Hex,
  parityVectorsContentHash:
    "0x8ccba890d2ec3ed28586f548b087d53e36630fe1d4a55c8c21471bc9e1fb9cf2" as Hex,
  poolsJsonHash:
    "0x582b48fdaeb3c88bfc40415ba5a86d1cfd1bd4fe208fa6533f3681c02700f1c7" as Hex,
  poolsContentHash:
    "0xca5d31d8b6266a075137c83d58b00bce1c763f30b73388719a6e2bce29085fcf" as Hex,
  poolStateSnapshotJsonHash:
    "0x5d7fa2a9ccd334bfae92e1ef1e8eb5b77ba48cc2e9945ee71769f014c75f4c07" as Hex,
  poolStateSnapshotContentHash:
    "0x2ade046cb16534b3e50a41b04c2885427d6d7fc0deba9d7865c7f3a553ba15de" as Hex,
  routeArtifactIds: [
    "solver-eth-zora-basedflick-fame",
    "solver-fame-basedflick-zora-eth",
    "solver-fame-basedflick-zora-usdc",
    "solver-fame-basedflick-zora-weth",
    "solver-usdc-split-frxusd-merge-fame",
    "solver-usdc-zora-basedflick-fame",
    "solver-weth-split-fame",
  ],
  requiredVenueTargets: [
    {
      family: "Slipstream",
      familyOrdinal: 2,
      target: "0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5",
    },
    {
      family: "Slipstream2",
      familyOrdinal: 3,
      target: "0xcbBb8035cAc7D4B3Ca7aBb74cF7BdF900215Ce0D",
    },
    {
      family: "Solidly",
      familyOrdinal: 0,
      target: "0x2F87Bf58D5A9b2eFadE55Cdbd46153a0902be6FA",
    },
    {
      family: "UniswapV2",
      familyOrdinal: 1,
      target: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
    },
    {
      family: "UniswapV3",
      familyOrdinal: 4,
      target: "0x6fF5693b99212Da76ad316178A184AB56D299b43",
    },
    {
      family: "UniswapV4",
      familyOrdinal: 5,
      target: "0x6fF5693b99212Da76ad316178A184AB56D299b43",
    },
    {
      family: "NativeWrap",
      familyOrdinal: 6,
      target: "0x4200000000000000000000000000000000000006",
    },
    {
      family: "AerodromeV2",
      familyOrdinal: 7,
      target: "0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43",
    },
  ],
  requiredV4HookDataKeys: [] as readonly Hex[],
} as const;

export type FameSwapArtifactManifest = typeof FAME_SWAP_ARTIFACT_MANIFEST;
export type FameSwapRouteArtifactId =
  (typeof FAME_SWAP_ARTIFACT_MANIFEST.routeArtifactIds)[number];
