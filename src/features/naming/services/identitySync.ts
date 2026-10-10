import {
  BaseError,
  UserRejectedRequestError,
  erc721Abi,
  type Address,
  type Hash,
  type PublicClient,
  zeroAddress,
} from "viem";
import { flsNamingAbi } from "@/wagmi";
import type { Identity } from "./identityIndex";

export type PendingIdentityBurn = Identity & {
  gateNft: Address;
  tokenOwner: Address;
  blockNumber: bigint;
};

async function simulateIdentity(
  client: PublicClient,
  address: Address,
  identity: Identity,
  gateNft: Address,
  blockNumber: bigint,
  account?: Address,
): Promise<PendingIdentityBurn | null> {
  const [linkedTokenId, tokenOwner] = await Promise.all([
    client.readContract({
      address,
      abi: flsNamingAbi,
      functionName: "addressToTokenId",
      args: [identity.primaryAddress],
      blockNumber,
    }),
    client.readContract({
      address: gateNft,
      abi: erc721Abi,
      functionName: "ownerOf",
      args: [identity.primaryTokenId],
      blockNumber,
    }),
    // sync has no return value. Validate the actual call, then read its burn
    // condition (isVerified for the bound NFT's owner) at the same block.
    client.simulateContract({
      address,
      abi: flsNamingAbi,
      functionName: "sync",
      args: [identity.primaryAddress],
      blockNumber,
      account,
    }),
  ]);
  if (linkedTokenId !== identity.tokenId)
    throw new Error("This identity changed. Please sync again.");
  const isVerified = await client.readContract({
    address,
    abi: flsNamingAbi,
    functionName: "isVerified",
    args: [identity.tokenId, tokenOwner],
    blockNumber,
  });
  return isVerified ? null : { ...identity, gateNft, tokenOwner, blockNumber };
}

export async function previewIdentityBurn(
  client: PublicClient,
  address: Address,
  tokenId: bigint,
  account?: Address,
) {
  const blockNumber = await client.getBlockNumber({ cacheTime: 0 });
  const [[name, primaryAddress, primaryTokenId], gateNft] = await Promise.all([
    client.readContract({
      address,
      abi: flsNamingAbi,
      functionName: "getIdentity",
      args: [tokenId],
      blockNumber,
    }),
    client.readContract({
      address,
      abi: flsNamingAbi,
      functionName: "gateNft",
      blockNumber,
    }),
  ]);
  if (primaryAddress === zeroAddress) return null;
  return simulateIdentity(
    client,
    address,
    { tokenId, name, primaryAddress, primaryTokenId, socialHandles: {} },
    gateNft,
    blockNumber,
    account,
  );
}

export function sameIdentityBurn(
  before: PendingIdentityBurn,
  after: PendingIdentityBurn,
) {
  return (
    before.tokenId === after.tokenId &&
    before.name === after.name &&
    before.primaryTokenId === after.primaryTokenId &&
    before.primaryAddress.toLowerCase() ===
      after.primaryAddress.toLowerCase() &&
    before.tokenOwner.toLowerCase() === after.tokenOwner.toLowerCase() &&
    before.gateNft.toLowerCase() === after.gateNft.toLowerCase()
  );
}

export class SettledSyncError extends Error {}

export async function waitForIdentitySync(
  client: PublicClient,
  hash: Hash,
  onHash: (hash: Hash) => void,
) {
  let replaced = false;
  const receipt = await client.waitForTransactionReceipt({
    hash,
    confirmations: 1,
    onReplaced: (replacement) => {
      if (replacement.reason === "repriced")
        onHash(replacement.transaction.hash);
      else replaced = true;
    },
  });
  if (replaced)
    throw new SettledSyncError("Sync transaction was cancelled or replaced.");
  if (receipt.status !== "success")
    throw new SettledSyncError("Sync transaction reverted.");
  return receipt;
}

export function identitySyncError(error: unknown) {
  if (
    error instanceof BaseError &&
    error.walk((cause) => cause instanceof UserRejectedRequestError) instanceof
      UserRejectedRequestError
  )
    return "Transaction declined in your wallet.";
  if (error instanceof BaseError)
    return error.shortMessage.split("\n")[0].slice(0, 180);
  return error instanceof Error
    ? error.message.split("\n")[0].slice(0, 180)
    : "Sync failed. Please try again.";
}
