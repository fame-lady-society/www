import {
  wrappedNftAddress,
  useWriteBulkMinterSetApprovalForAll,
  useReadBulkMinterIsApprovedForAll,
  bulkMinterAbi,
  bulkMinterAddress,
} from "@/wagmi";
import { FC, useCallback } from "react";
import { WrapCardContent } from "./SepoliaWrapCardContent";
import { useAccount, useWriteContract } from "wagmi";

export const SepoliaSelectWrap: FC<{}> = () => {
  const { address: selectedAddress, chain: currentChain } = useAccount();

  const isValidToCheckApproval =
    selectedAddress &&
    currentChain &&
    (wrappedNftAddress as any)[currentChain?.id] !== undefined;

  const {
    data: isApprovedForAll,
    isFetched: isApprovedForAllFetched,
    refetch,
  } = useReadBulkMinterIsApprovedForAll({
    ...(isValidToCheckApproval && {
      args: [
        selectedAddress,
        (wrappedNftAddress as any)[currentChain?.id] as `0x${string}`,
      ],
    }),
  });
  const {
    writeContractAsync: setApprovalForAll,
    isError: approveIsError,
    isPending: approveIsLoading,
    isSuccess: approveIsSuccess,
  } = useWriteContract();
  const onUpdate = useCallback(() => {
    refetch?.();
  }, [refetch]);
  return (
    <WrapCardContent
      isApprovedForAll={isApprovedForAll}
      setApprovalForAll={() =>
        setApprovalForAll({
          args: [wrappedNftAddress[currentChain?.id], true],
          abi: bulkMinterAbi,
          address: bulkMinterAddress[currentChain?.id],
          functionName: "setApprovalForAll",
        })
      }
      approveIsError={approveIsError}
      approveIsSuccess={approveIsSuccess}
      onUpdate={onUpdate}
    />
  );
};
