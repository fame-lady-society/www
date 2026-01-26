import { type TypedDataDomain } from "viem";
import { flsNamingAddress } from "@/wagmi";
import type { NetworkType } from "../hooks/useOwnedGateNftTokens";
import { getChainId } from "./networkUtils";

// EIP-712 domain for FLSNaming contract
export const FLS_IDENTITY_DOMAIN_NAME = "FLS Identity";
export const FLS_IDENTITY_DOMAIN_VERSION = "1";

// Type definition for AddVerifiedAddress
export const ADD_VERIFIED_ADDRESS_TYPES = {
  AddVerifiedAddress: [
    { name: "tokenId", type: "uint256" },
    { name: "addr", type: "address" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export interface AddVerifiedAddressMessage {
  tokenId: bigint;
  addr: `0x${string}`;
  nonce: bigint;
}

export function getFlsNamingAddress(network: NetworkType): `0x${string}` {
  const chainId = getChainId(network);
  const address = flsNamingAddress[chainId as keyof typeof flsNamingAddress];
  if (!address) {
    throw new Error(`FLSNaming not deployed on network: ${network}`);
  }
  return address;
}

export function buildAddVerifiedAddressDomain(
  network: NetworkType
): TypedDataDomain {
  const chainId = getChainId(network);
  const verifyingContract = getFlsNamingAddress(network);

  return {
    name: FLS_IDENTITY_DOMAIN_NAME,
    version: FLS_IDENTITY_DOMAIN_VERSION,
    chainId: BigInt(chainId),
    verifyingContract,
  };
}

export function buildAddVerifiedAddressTypedData(
  network: NetworkType,
  tokenId: bigint,
  targetAddress: `0x${string}`,
  nonce: bigint
) {
  return {
    domain: buildAddVerifiedAddressDomain(network),
    types: ADD_VERIFIED_ADDRESS_TYPES,
    primaryType: "AddVerifiedAddress" as const,
    message: {
      tokenId,
      addr: targetAddress,
      nonce,
    },
  };
}

// Helper to format the typed data for display purposes
export function formatTypedDataForDisplay(
  network: NetworkType,
  tokenId: bigint,
  targetAddress: `0x${string}`,
  nonce: bigint
): string {
  const data = buildAddVerifiedAddressTypedData(
    network,
    tokenId,
    targetAddress,
    nonce
  );

  return JSON.stringify(
    {
      domain: {
        ...data.domain,
        chainId: data.domain.chainId?.toString(),
      },
      types: data.types,
      primaryType: data.primaryType,
      message: {
        tokenId: tokenId.toString(),
        addr: targetAddress,
        nonce: nonce.toString(),
      },
    },
    null,
    2
  );
}
