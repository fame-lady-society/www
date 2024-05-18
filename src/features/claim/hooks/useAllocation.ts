import { useMemo } from "react";
import { erc721Abi } from "viem";
import { useReadContracts } from "wagmi";
import { mainnet, polygon } from "viem/chains";
import { allocatePercentages } from "@/utils/claim";
import {
  HUNNYS_CONTRACT,
  MERMAIDS_CONTRACT,
  METAVIXEN_CONTRACT,
  FLS_TOKENS,
  MARKET_CAP,
  SISTER_TOKENS,
} from "./constants";
import { useSnapshot } from "./useSnapshot";

export function useAllocation({
  address,
  rankBoost,
  ageBoost,
}: {
  address?: `0x${string}`;
  rankBoost: number;
  ageBoost: number;
}) {
  const { data: mainnetData } = useReadContracts({
    contracts: address
      ? [
          {
            abi: erc721Abi,
            address: HUNNYS_CONTRACT,
            functionName: "balanceOf",
            args: [address],
            chainId: mainnet.id,
          },
          {
            abi: erc721Abi,
            address: MERMAIDS_CONTRACT,
            functionName: "balanceOf",
            args: [address],
            chainId: mainnet.id,
          },
        ]
      : [],
  });

  const { data: polygonData } = useReadContracts({
    contracts: address
      ? [
          {
            abi: erc721Abi,
            address: METAVIXEN_CONTRACT,
            functionName: "balanceOf",
            args: [address],
            chainId: polygon.id,
          },
        ]
      : [],
  });

  const mainnetHunnys = mainnetData?.[0]?.result;
  const mainnetMermaids = mainnetData?.[1]?.result;
  const polygonMetavixens = polygonData?.[0]?.result;
  const { flsPoolAllocation, snapshot } = useSnapshot(rankBoost, ageBoost);

  return useMemo(() => {
    const lowerCaseAddress = address?.toLowerCase();
    const flsTokens = lowerCaseAddress
      ? snapshot
          .filter((item) => item.owner?.toLowerCase() === lowerCaseAddress)
          .map(({ tokenId }) => flsPoolAllocation.get(Number(tokenId))!)
      : [];
    const flsAllocation = flsTokens.reduce(
      (acc, allocation) => acc + allocation,
      0n,
    );
    const hunnysAllocation = mainnetHunnys
      ? BigInt(
          ((Number(mainnetHunnys) * 0.03) / MARKET_CAP) * Number(SISTER_TOKENS),
        )
      : 0n;
    const mermaidsAllocation = mainnetMermaids
      ? BigInt(
          ((Number(mainnetMermaids) * 0.03) / MARKET_CAP) *
            Number(SISTER_TOKENS),
        )
      : 0n;
    const metavixensAllocation = polygonMetavixens
      ? BigInt(
          ((Number(polygonMetavixens) * 0.03) / MARKET_CAP) *
            Number(SISTER_TOKENS),
        )
      : 0n;

    return {
      hunnys: hunnysAllocation,
      mermaids: mermaidsAllocation,
      metavixens: metavixensAllocation,
      fls: flsAllocation,
      total:
        flsAllocation +
        hunnysAllocation +
        mermaidsAllocation +
        metavixensAllocation,
    };
  }, [
    address,
    flsPoolAllocation,
    mainnetHunnys,
    mainnetMermaids,
    polygonMetavixens,
    snapshot,
  ]);
}
