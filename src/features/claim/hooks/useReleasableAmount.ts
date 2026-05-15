import { useChainId } from "wagmi";
import { useAccount } from "@/hooks/useAccount";
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
    ...(vestingScheduleId ? { args: [vestingScheduleId] } : {}),
  });
  const isLoading =
    vestingScheduleIdIsLoading ||
    (computeReleasableAmountIsLoading && !isRefetchingReleasableAmount);

  return {
    isLoading,
    releasableAmount,
    vestingScheduleId,
  };
}
