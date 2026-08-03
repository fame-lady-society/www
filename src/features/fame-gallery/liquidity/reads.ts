import { isAddressEqual, type Address } from "viem";
import {
  creatorArtistMagicAbi,
  fameMirrorAbi,
  universalPoolArtMarketplaceAbi,
} from "../../../wagmi";
import {
  readGalleryCustodyStates,
  runGalleryBatchedReads,
  type GalleryMulticallClient,
  type GalleryReadAddresses,
} from "../reads";
import type { GalleryProjectionResult } from "../types";

export type GalleryLiquidityToken = Readonly<{
  tokenId: bigint;
  tokenUri: string | null;
}>;

export type GalleryLiquidityProviderPosition = Readonly<{
  account: Address;
  unitCount: bigint;
  indexPlusOne: bigint;
}>;

export type GalleryLiquidityReadClient = GalleryMulticallClient & {
  readContract: (input: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
    blockNumber: bigint;
  }) => Promise<unknown>;
};

function failure(message: string, blockNumber: bigint) {
  return { status: "failure" as const, blockNumber, message };
}

function plural(value: number, singular: string, pluralForm = `${singular}s`) {
  return value === 1 ? singular : pluralForm;
}

export async function readWalletOwnedSociety(
  client: GalleryLiquidityReadClient,
  blockNumber: bigint,
  account: Address,
  tokenIds: readonly bigint[],
  addresses: GalleryReadAddresses,
): Promise<GalleryProjectionResult<readonly GalleryLiquidityToken[]>> {
  try {
    const [custody, balance] = await Promise.all([
      readGalleryCustodyStates(client, blockNumber, tokenIds, addresses),
      client.readContract({
        abi: fameMirrorAbi,
        address: addresses.mirror,
        functionName: "balanceOf",
        args: [account],
        blockNumber,
      }),
    ]);
    if ([...custody.values()].some((state) => state.status === "failure")) {
      return failure("Society ownership scan is incomplete.", blockNumber);
    }
    const ownedTokenIds = tokenIds.filter((tokenId) => {
      const state = custody.get(tokenId);
      return (
        state?.status === "success" && isAddressEqual(state.data.owner, account)
      );
    });
    if (typeof balance !== "bigint") {
      return failure("Society balance is unavailable.", blockNumber);
    }
    if (BigInt(ownedTokenIds.length) !== balance) {
      return failure(
        `Society ownership scan found ${ownedTokenIds.length} ${plural(
          ownedTokenIds.length,
          "token",
        )} but balanceOf is ${balance.toString()}.`,
        blockNumber,
      );
    }

    let metadata: Awaited<ReturnType<typeof runGalleryBatchedReads>> = [];
    try {
      metadata = await runGalleryBatchedReads(
        client,
        blockNumber,
        ownedTokenIds,
        (tokenId) => [
          {
            address: addresses.creatorMagic,
            abi: creatorArtistMagicAbi,
            functionName: "tokenURI",
            args: [tokenId],
          },
        ],
      );
    } catch {
      // A metadata outage must not hide verified wallet ownership.
    }
    const metadataByTokenId = new Map(
      metadata.map(({ tokenId, results }) => [tokenId, results[0]]),
    );
    return {
      status: "success",
      blockNumber,
      data: ownedTokenIds.map((tokenId) => {
        const tokenUri = metadataByTokenId.get(tokenId);
        return {
          tokenId,
          tokenUri:
            tokenUri?.status === "success" &&
            typeof tokenUri.result === "string"
              ? tokenUri.result
              : null,
        };
      }),
    };
  } catch {
    return failure("Society ownership is unavailable.", blockNumber);
  }
}

export async function readLiquidityInventory(
  client: GalleryLiquidityReadClient,
  blockNumber: bigint,
  tokenIds: readonly bigint[],
  addresses: GalleryReadAddresses,
): Promise<GalleryProjectionResult<readonly GalleryLiquidityToken[]>> {
  const custody = await readGalleryCustodyStates(
    client,
    blockNumber,
    tokenIds,
    addresses,
  );
  if ([...custody.values()].some((state) => state.status === "failure")) {
    return failure(
      "Marketplace Society inventory scan is incomplete.",
      blockNumber,
    );
  }
  const heldTokenIds = tokenIds.filter((tokenId) => {
    const state = custody.get(tokenId);
    return state?.status === "success" && state.data.marketplaceHeld;
  });
  let metadata: Awaited<ReturnType<typeof runGalleryBatchedReads>> = [];
  try {
    metadata = await runGalleryBatchedReads(
      client,
      blockNumber,
      heldTokenIds,
      (tokenId) => [
        {
          address: addresses.creatorMagic,
          abi: creatorArtistMagicAbi,
          functionName: "tokenURI",
          args: [tokenId],
        },
      ],
    );
  } catch {
    // Inventory remains browseable by token ID when metadata is unavailable.
  }
  const metadataByTokenId = new Map(
    metadata.map(({ tokenId, results }) => [tokenId, results[0]]),
  );
  return {
    status: "success",
    blockNumber,
    data: heldTokenIds.map((tokenId) => {
      const tokenUri = metadataByTokenId.get(tokenId);
      return {
        tokenId,
        tokenUri:
          tokenUri?.status === "success" && typeof tokenUri.result === "string"
            ? tokenUri.result
            : null,
      };
    }),
  };
}

export async function readLiquidityProviderPosition(
  client: GalleryLiquidityReadClient,
  blockNumber: bigint,
  account: Address,
  addresses: GalleryReadAddresses,
): Promise<GalleryProjectionResult<GalleryLiquidityProviderPosition>> {
  try {
    const position = await client.readContract({
      abi: universalPoolArtMarketplaceAbi,
      address: addresses.marketplace,
      functionName: "providerPosition",
      args: [account],
      blockNumber,
    });
    if (
      !Array.isArray(position) ||
      typeof position[0] !== "bigint" ||
      typeof position[1] !== "bigint"
    ) {
      return failure("Provider position is incomplete.", blockNumber);
    }
    return {
      status: "success",
      blockNumber,
      data: {
        account,
        unitCount: position[0],
        indexPlusOne: position[1],
      },
    };
  } catch {
    return failure("Provider position is unavailable.", blockNumber);
  }
}
