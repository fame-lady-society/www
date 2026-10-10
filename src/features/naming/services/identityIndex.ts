import { type Address, type PublicClient, zeroAddress } from "viem";
import { flsNamingAbi } from "@/wagmi";
import {
  SOCIAL_PROVIDERS,
  decodeAttestationV1,
  getSocialAttestationKey,
  type SocialProviderId,
} from "../attestations";

export interface Identity {
  tokenId: bigint;
  name: string;
  primaryAddress: Address;
  primaryTokenId: bigint;
  socialHandles: Partial<Record<SocialProviderId, string>>;
}

export async function readIdentityIndex(
  client: PublicClient,
  address: Address,
  blockNumber: bigint,
) {
  const nextTokenId = await client.readContract({
    address,
    abi: flsNamingAbi,
    functionName: "nextTokenId",
    blockNumber,
  });
  const tokenIds: bigint[] = [];
  for (let tokenId = 1n; tokenId < nextTokenId; tokenId++)
    tokenIds.push(tokenId);
  if (tokenIds.length === 0)
    return { identities: [] as Identity[], totalCount: 0, blockNumber };

  const [identityResults, metadataResults] = await Promise.all([
    client.multicall({
      allowFailure: false,
      blockNumber,
      contracts: tokenIds.map((tokenId) => ({
        address,
        abi: flsNamingAbi,
        functionName: "getIdentity" as const,
        args: [tokenId] as const,
      })),
    }),
    client.multicall({
      allowFailure: false,
      blockNumber,
      contracts: tokenIds.flatMap((tokenId) =>
        SOCIAL_PROVIDERS.map((provider) => ({
          address,
          abi: flsNamingAbi,
          functionName: "getMetadata" as const,
          args: [tokenId, getSocialAttestationKey(provider)] as const,
        })),
      ),
    }),
  ]);
  const identities: Identity[] = [];
  identityResults.forEach(([name, primaryAddress, primaryTokenId], index) => {
    if (primaryAddress === zeroAddress) return;
    const socialHandles: Identity["socialHandles"] = {};
    SOCIAL_PROVIDERS.forEach((provider, providerIndex) => {
      const attestation = decodeAttestationV1(
        metadataResults[index * SOCIAL_PROVIDERS.length + providerIndex],
      );
      if (attestation?.handle) socialHandles[provider] = attestation.handle;
    });
    identities.push({
      tokenId: tokenIds[index],
      name,
      primaryAddress,
      primaryTokenId,
      socialHandles,
    });
  });
  return { identities, totalCount: identities.length, blockNumber };
}
