import {
  keccak256,
  toHex,
  zeroAddress,
  type Address,
  type PublicClient,
} from "viem";
import { flsNamingAbi } from "@/wagmi";
import {
  SOCIAL_PROVIDERS,
  getSocialAttestationKey,
  getSocialAttestationStatus,
  safeHexToString,
  type SocialAttestationStatus,
} from "../attestations";

export interface FullIdentity {
  tokenId: bigint;
  name: string;
  primaryAddress: Address;
  primaryTokenId: bigint;
  verifiedAddresses: readonly Address[];
  description: string;
  website: string;
  socialAttestations: SocialAttestationStatus[];
}

export const METADATA_KEYS = {
  description: keccak256(toHex("description")),
  website: keccak256(toHex("website")),
} as const;

export async function readIdentityProfile(
  client: PublicClient,
  address: Address,
  chainId: number,
  identifier: string | bigint,
  blockNumber: bigint,
): Promise<{ identity: FullIdentity | null; blockNumber: bigint }> {
  const tokenId =
    typeof identifier === "bigint" || /^\d+$/.test(identifier)
      ? BigInt(identifier)
      : await client.readContract({
          address,
          abi: flsNamingAbi,
          functionName: "resolveName",
          args: [identifier],
          blockNumber,
        });
  if (tokenId === 0n) return { identity: null, blockNumber };
  const [name, primaryAddress, primaryTokenId] = await client.readContract({
    address,
    abi: flsNamingAbi,
    functionName: "getIdentity",
    args: [tokenId],
    blockNumber,
  });
  if (primaryAddress === zeroAddress) return { identity: null, blockNumber };

  const [verifiedAddresses, metadata] = await Promise.all([
    client.readContract({
      address,
      abi: flsNamingAbi,
      functionName: "getVerifiedAddresses",
      args: [tokenId],
      blockNumber,
    }),
    client.multicall({
      allowFailure: false,
      blockNumber,
      contracts: [
        METADATA_KEYS.description,
        METADATA_KEYS.website,
        ...SOCIAL_PROVIDERS.map(getSocialAttestationKey),
      ].map((key) => ({
        address,
        abi: flsNamingAbi,
        functionName: "getMetadata" as const,
        args: [tokenId, key] as const,
      })),
    }),
  ]);
  const socialAttestations: SocialAttestationStatus[] = [];
  const attestor = process.env.NEXT_PUBLIC_SOCIAL_ATTESTOR_ADDRESS;
  if (attestor && /^0x[a-fA-F0-9]{40}$/.test(attestor)) {
    const statuses = await Promise.all(
      SOCIAL_PROVIDERS.map((provider, index) =>
        getSocialAttestationStatus(provider, metadata[2 + index], {
          chainId,
          verifyingContract: address,
          attestorAddress: attestor as Address,
          namehash: keccak256(toHex(name)),
          expectedAudience: process.env.NEXT_PUBLIC_SOCIAL_ATTESTATION_AUD,
        }),
      ),
    );
    for (const status of statuses) {
      if (status) socialAttestations.push(status);
    }
  }
  return {
    identity: {
      tokenId,
      name,
      primaryAddress,
      primaryTokenId,
      verifiedAddresses,
      description: safeHexToString(metadata[0]) ?? "",
      website: safeHexToString(metadata[1]) ?? "",
      socialAttestations,
    },
    blockNumber,
  };
}
