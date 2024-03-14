import {
  fameLadySocietyAddress,
  useWriteFameLadySocietySetApprovalForAll,
  useReadFameLadySocietyIsApprovedForAll,
  useReadFameLadySocietyBalanceOf,
  fameLadySquadAddress,
  fameLadySquadABI,
} from "@/wagmi";
import { BigNumber } from "ethers";
import { FC, useMemo } from "react";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { TurboWrapContent } from "./TurboWrapContent";

export const MainnetTurboWrap: FC<{}> = () => {
  const { address: selectedAddress } = useAccount();
  const chainId = useChainId();

  const isValidToCheckApproval =
    selectedAddress && fameLadySocietyAddress[chainId] !== undefined;

  const { data: isApprovedForAll, isFetched: isApprovedForAllFetched } =
    useReadFameLadySocietyIsApprovedForAll({
      ...(isValidToCheckApproval && {
        args: [selectedAddress, fameLadySocietyAddress[chainId]],
      }),
    });
  const {
    writeContractAsync: setApprovalForAll,
    isError: approveIsError,
    isPending: approveIsLoading,
    isSuccess: approveIsSuccess,
  } = useWriteFameLadySocietySetApprovalForAll({});

  const { data: balanceOf } = useReadFameLadySocietyBalanceOf({
    ...(selectedAddress !== undefined && {
      args: [selectedAddress],
    }),
  });
  const { data: ownedTokens } = useReadContracts({
    contracts:
      selectedAddress !== undefined && balanceOf !== undefined
        ? (Array.from({ length: Number(balanceOf) }).map((_, index) => ({
            abi: fameLadySquadABI,
            address: fameLadySquadAddress[currentChain?.id] as `0x${string}`,
            functionName: "tokenOfOwnerByIndex",
            args: [selectedAddress, BigNumber.from(index)],
          })) as {
            abi: typeof fameLadySquadABI;
            address: `0x${string}`;
            functionName: "tokenOfOwnerByIndex";
            args: [string, BigNumber];
          }[])
        : [],
  });

  const tokenIds = useMemo(() => {
    return (ownedTokens ?? [])
      .filter((tokenId) => !!tokenId?.result)
      .map((t) => t.result) as bigint[];
  }, [ownedTokens]);

  return (
    <TurboWrapContent
      approveIsError={approveIsError}
      approveIsSuccess={approveIsSuccess}
      tokenIds={tokenIds}
      isApprovedForAll={isApprovedForAll}
      setApprovalForAll={() =>
        setApprovalForAll({
          args: [
            fameLadySocietyAddress[currentChain?.id] as `0x${string}`,
            true,
          ],
        })
      }
      testnet={false}
    />
  );
};
