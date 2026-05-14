import type { Hex } from "viem";

export const FAME_SWAP_ARTIFACT_MANIFEST = {
  sourceRepo: "../fame-contracts",
  sourceBranch: "feat/fame-multi-leg-router",
  sourceCommit: "c4a056952a3d0f0f55ead6e6d6b2f4b3e48844ab",
  schemaVersion: 1,
  pinnedBaseBlock: 45_884_844,
  solverRoutesJsonHash:
    "0x44cd1807a871080e02630714058ccd2545746712c9b382ffe4411223feeaf218" as Hex,
  gapMatrixJsonHash:
    "0xe12b694540180d42f640c9b660379eab7e38caef92f24e22c629f6b6da4c427e" as Hex,
  parityVectorsJsonHash:
    "0xf9a0cfbddc5ad9a5a2507c490f592ec72ba111e48d3ec0ea8612f69e35998aee" as Hex,
  poolsJsonHash:
    "0xa3a83e1eb4ab889a20c144f885ed3533a59784726098be3d43f3257d219af28b" as Hex,
  poolStateSnapshotJsonHash:
    "0xf235b93fbf297af3210e779c0bd8d792f0c8912e6d1335853879339f94a80407" as Hex,
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
  ],
  requiredV4HookDataKeys: [] as readonly Hex[],
} as const;

export type FameSwapArtifactManifest = typeof FAME_SWAP_ARTIFACT_MANIFEST;
export type FameSwapRouteArtifactId =
  (typeof FAME_SWAP_ARTIFACT_MANIFEST.routeArtifactIds)[number];
