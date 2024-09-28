import { client as baseClient } from "@/viem/base-client";
import { fameVestingAbi } from "@/wagmi";
import { fameVestingFromNetwork } from "../contracts";
import { base } from "viem/chains";

export async function fetchReleasableAmount({
  address,
}: {
  address: `0x${string}`;
}) {
  const vestingScheduleId = await baseClient.readContract({
    address: fameVestingFromNetwork(base.id)!,
    abi: fameVestingAbi,
    functionName: "computeVestingScheduleIdForAddressAndIndex",
    args: [address, 0n],
  });

  const releasableAmount = await baseClient.readContract({
    address: fameVestingFromNetwork(base.id)!,
    abi: fameVestingAbi,
    functionName: "computeReleasableAmount",
    args: [vestingScheduleId],
  });

  return releasableAmount;
}
