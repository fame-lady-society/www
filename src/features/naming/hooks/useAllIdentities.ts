"use client";

import { useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { flsNamingAddress } from "@/wagmi";
import type { NetworkType } from "./useOwnedGateNftTokens";
import { getChainId } from "../utils/networkUtils";
import { readIdentityIndex } from "../services/identityIndex";

export type { Identity } from "../services/identityIndex";

export function useAllIdentities(
  network: NetworkType,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const chainId = getChainId(network);
  const address = flsNamingAddress[chainId as keyof typeof flsNamingAddress];
  const client = usePublicClient({ chainId });
  const queryClient = useQueryClient();
  const minimumReadBlock = useRef<
    { chainId: number; blockNumber: bigint } | undefined
  >(undefined);
  const queryKey = ["flsNamingIdentities", chainId, address] as const;
  const readIndex = useCallback(
    async (minimumBlock?: bigint) => {
      if (!client) throw new Error("Network unavailable. Please try again.");
      const head = await client.getBlockNumber({ cacheTime: 0 });
      const saved = minimumReadBlock.current;
      const cachedBlock = queryClient.getQueryData<{ blockNumber: bigint }>([
        "flsNamingIdentities",
        chainId,
        address,
      ])?.blockNumber;
      let blockNumber = head;
      for (const floor of [
        minimumBlock,
        saved?.chainId === chainId ? saved.blockNumber : undefined,
        cachedBlock,
      ]) {
        if (floor !== undefined && floor > blockNumber) blockNumber = floor;
      }
      return readIdentityIndex(client, address, blockNumber);
    },
    [client, address, chainId, queryClient],
  );
  const query = useQuery({
    queryKey,
    queryFn: () => readIndex(),
    enabled: enabled && !!client,
  });

  const refetchIdentities = useCallback(
    async (minimumBlock?: bigint) => {
      if (minimumBlock !== undefined) {
        const saved = minimumReadBlock.current;
        minimumReadBlock.current = {
          chainId,
          blockNumber:
            saved?.chainId === chainId && saved.blockNumber > minimumBlock
              ? saved.blockNumber
              : minimumBlock,
        };
      }
      const key = ["flsNamingIdentities", chainId, address] as const;
      // Cancel older reads before publishing the index after a sync receipt.
      await queryClient.cancelQueries({ queryKey: key, exact: true });
      await queryClient.invalidateQueries({
        queryKey: key,
        exact: true,
        refetchType: "none",
      });
      await queryClient.fetchQuery({
        queryKey: key,
        queryFn: () => readIndex(minimumBlock),
        staleTime: 0,
      });
    },
    [queryClient, chainId, address, readIndex],
  );

  return {
    identities: query.data?.identities ?? [],
    totalCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetchIdentities,
  };
}
