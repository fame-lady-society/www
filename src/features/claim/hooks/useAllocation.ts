import { useMemo } from "react";
import { erc721Abi } from "viem";
import { useReadContracts } from "wagmi";
import snapshot from "@/app/fame/admin/test-claim.json";
import { mainnet, polygon } from "viem/chains";
import { allocatePercentages, allocatePool } from "@/utils/claim";

const HUNNYS_CONTRACT = "0x5dfeb75abae11b138a16583e03a2be17740eaded";
const METAVIXEN_CONTRACT = "0xe1c7be9a91bb376acbb7c205f1f733a3468153b4";
const MERMAIDS_CONTRACT = "0x4ea5f0949107f13f9514e0cb485a49f52bf759a6";

const MARKET_CAP = 10172.92;
const TOTAL_TOKENS = 888_000_000n * 10n ** 18n;
const FLS_TOKENS = (TOTAL_TOKENS * 235n) / 1000n;
const SISTER_TOKENS = (TOTAL_TOKENS * 15n) / 1000n;

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
  const flsPoolAllocation = useMemo(() => {
    // find the max blockHeightMinted
    let maxBlockHeightMinted = 0;
    for (const item of snapshot) {
      if (
        item.blockHeightMinted &&
        Number(item.blockHeightMinted) > maxBlockHeightMinted
      ) {
        maxBlockHeightMinted = Number(item.blockHeightMinted);
      }
    }
    return allocatePercentages(
      snapshot.map(({ ogRank, tokenId, blockHeightMinted }) => ({
        blockHeightMinted:
          (blockHeightMinted && Number(blockHeightMinted)) ||
          maxBlockHeightMinted,
        ogRank: Number(ogRank),
        tokenId: Number(tokenId),
      })),
      rankBoost,
      ageBoost,
    ).reduce((acc, { tokenId, percentage }) => {
      acc.set(tokenId, BigInt(percentage * Number(FLS_TOKENS)));
      return acc;
    }, new Map<number, bigint>());
  }, [rankBoost, ageBoost]);

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
    };
  }, [
    address,
    flsPoolAllocation,
    mainnetHunnys,
    mainnetMermaids,
    polygonMetavixens,
  ]);
}
