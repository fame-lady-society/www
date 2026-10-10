"use client";

import { useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { flsNamingAddress } from "@/wagmi";
import { readIdentityProfile } from "../services/identityProfile";
import { getChainId } from "../utils/networkUtils";
import type { NetworkType } from "./useOwnedGateNftTokens";

export { METADATA_KEYS, type FullIdentity } from "../services/identityProfile";

export function useIdentity(
  network: NetworkType,
  identifier: string | bigint | undefined,
) {
  const chainId = getChainId(network);
  const address = flsNamingAddress[chainId as keyof typeof flsNamingAddress];
  const client = usePublicClient({ chainId });
  const queryClient = useQueryClient();
  const minimumReadBlock = useRef<
    { chainId: number; blockNumber: bigint } | undefined
  >(undefined);
  const queryKey = [
    "flsNamingIdentity",
    chainId,
    address,
    identifier?.toString(),
  ] as const;
  const readProfile = useCallback(
    async (minimumBlock?: bigint) => {
      if (!client) throw new Error("Network unavailable. Please try again.");
      if (identifier === undefined) throw new Error("Identity is required.");
      const head = await client.getBlockNumber({ cacheTime: 0 });
      const saved = minimumReadBlock.current;
      const cachedBlock = queryClient.getQueryData<{ blockNumber: bigint }>([
        "flsNamingIdentity",
        chainId,
        address,
        identifier.toString(),
      ])?.blockNumber;
      let blockNumber = head;
      for (const floor of [
        minimumBlock,
        saved?.chainId === chainId ? saved.blockNumber : undefined,
        cachedBlock,
      ]) {
        if (floor !== undefined && floor > blockNumber) blockNumber = floor;
      }
      return readIdentityProfile(
        client,
        address,
        chainId,
        identifier,
        blockNumber,
      );
    },
    [client, address, chainId, identifier, queryClient],
  );
  const query = useQuery({
    queryKey,
    queryFn: () => readProfile(),
    enabled: !!client && identifier !== undefined,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const refetchIdentity = useCallback(
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
      const key = [
        "flsNamingIdentity",
        chainId,
        address,
        identifier?.toString(),
      ] as const;
      // Discard older in-flight reads before publishing the post-sync profile.
      await queryClient.cancelQueries({ queryKey: key, exact: true });
      await queryClient.invalidateQueries({
        queryKey: key,
        exact: true,
        refetchType: "none",
      });
      await queryClient.fetchQuery({
        queryKey: key,
        queryFn: () => readProfile(minimumBlock),
        staleTime: 0,
      });
    },
    [queryClient, chainId, address, identifier, readProfile],
  );

  return {
    identity: query.data?.identity ?? null,
    isLoading: query.isLoading,
    error: query.error,
    notFound: query.isSuccess && query.data.identity === null,
    refetchIdentity,
  };
}
