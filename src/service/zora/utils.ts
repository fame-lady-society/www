import { decodeAbiParameters, encodeAbiParameters } from "viem";

export function decodeDopplerMultiCurveUniV4(poolConfig: `0x${string}`) {
  const [
    version,
    currency,
    tickLower,
    tickUpper,
    numDiscoveryPositions,
    maxDiscoverySupplyShare,
  ] = decodeAbiParameters(
    [
      {
        type: "uint8",
        name: "version",
      },
      {
        type: "address",
        name: "currency",
      },
      {
        type: "int24[]",
        name: "tickLower",
      },
      {
        type: "int24[]",
        name: "tickUpper",
      },
      {
        type: "uint16[]",
        name: "numDiscoveryPositions",
      },
      {
        type: "uint256[]",
        name: "maxDiscoverySupplyShare",
      },
    ] as const,
    poolConfig,
  );

  return [
    version,
    currency,
    tickLower,
    tickUpper,
    numDiscoveryPositions,
    maxDiscoverySupplyShare,
  ] as const;
}

export function encodeDopplerMultiCurveUniV4(
  currency: `0x${string}`,
  tickLower: readonly number[],
  tickUpper: readonly number[],
  numDiscoveryPositions: readonly number[],
  maxDiscoverySupplyShare: readonly bigint[],
) {
  return encodeAbiParameters(
    [
      { type: "uint8", name: "version" },
      { type: "address", name: "currency" },
      { type: "int24[]", name: "tickLower" },
      { type: "int24[]", name: "tickUpper" },
      { type: "uint16[]", name: "numDiscoveryPositions" },
      { type: "uint256[]", name: "maxDiscoverySupplyShare" },
    ],
    [
      4,
      currency,
      tickLower,
      tickUpper,
      numDiscoveryPositions,
      maxDiscoverySupplyShare,
    ],
  );
}
