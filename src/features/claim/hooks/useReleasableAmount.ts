import { useAccount, useChainId } from "wagmi";
import {
  useReadFameVestingComputeVestingScheduleIdForAddressAndIndex,
  useReadFameVestingComputeReleasableAmount,
} from "@/wagmi";
import { fameVestingFromNetwork } from "../contracts";
import { useEffect } from "react";
import { base } from "viem/chains";

export function useReleasableAmount() {
  const { address } = useAccount();

  const { data: vestingScheduleId, isLoading: vestingScheduleIdIsLoading } =
    useReadFameVestingComputeVestingScheduleIdForAddressAndIndex({
      chainId: base.id,
      address: fameVestingFromNetwork(base.id),
      args: address ? [address, 0n] : undefined,
    });
  const {
    data: releasableAmount,
    isLoading: computeReleasableAmountIsLoading,
    isError: computeReleasableAmountIsError,
    error: computeReleasableAmountError,
    refetch: refetchReleasableAmount,
    isRefetching: isRefetchingReleasableAmount,
  } = useReadFameVestingComputeReleasableAmount({
    chainId: base.id,
    address: fameVestingFromNetwork(base.id),
    args: vestingScheduleId ? [vestingScheduleId] : undefined,
  });
  const isLoading =
    vestingScheduleIdIsLoading ||
    (computeReleasableAmountIsLoading && !isRefetchingReleasableAmount);
  if (computeReleasableAmountIsError) {
    console.error(computeReleasableAmountError);
  }

  // Update releasable amount every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchReleasableAmount();
    }, 3000);
    return () => clearInterval(interval);
  }, [refetchReleasableAmount]);

  return {
    isLoading,
    releasableAmount,
    vestingScheduleId,
  };
}
