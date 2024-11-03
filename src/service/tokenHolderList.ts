import { fameVestingFromNetwork } from "@/features/claim/contracts";
import { fameFromNetwork } from "@/features/fame/contract";
import { getBuiltGraphSDK } from "@/graphclient";
import { fameVestingAbi } from "@/wagmi";
import {
  createPublicClient,
  erc20Abi,
  fallback,
  formatUnits,
  http,
} from "viem";
import { base } from "viem/chains";

const REVALIDATE_INTERVAL = 60 * 60;

export const client = createPublicClient({
  transport: fallback([
    http(process.env.NEXT_PUBLIC_BASE_RPC_URL_1, {
      batch: true,
      retryCount: 10,
      fetchOptions: {
        next: {
          revalidate: REVALIDATE_INTERVAL,
        },
      },
    }),
    http(process.env.NEXT_PUBLIC_BASE_RPC_URL_2, {
      batch: true,
      retryCount: 10,
      fetchOptions: {
        next: {
          revalidate: REVALIDATE_INTERVAL,
        },
      },
    }),
  ]),
  chain: base,
});

export async function famePresaleTokenHolders() {
  const sdk = getBuiltGraphSDK();
  const holders = await sdk.FamePresaleTokenHolders();
  return await Promise.all(
    holders.base_fame_nft_tokenBalances.map(async (balance) => {
      const [
        [
          fameReleasableAmount,
          { released: fameReleased, amountTotal: fameAmountTotal },
        ],
        fameBalance,
      ] = await Promise.all([
        client
          .readContract({
            abi: fameVestingAbi,
            address: fameVestingFromNetwork(base.id)!,
            functionName: "computeVestingScheduleIdForAddressAndIndex",
            args: [balance.owner, 0n],
          })
          .then(async (scheduleId) =>
            Promise.all([
              client.readContract({
                abi: fameVestingAbi,
                address: fameVestingFromNetwork(base.id)!,
                functionName: "computeReleasableAmount",
                args: [scheduleId],
              }),
              client.readContract({
                abi: fameVestingAbi,
                address: fameVestingFromNetwork(base.id)!,
                functionName: "getVestingSchedule",
                args: [scheduleId],
              }),
            ]),
          ),
        client.readContract({
          abi: erc20Abi,
          address: fameFromNetwork(base.id)!,
          functionName: "balanceOf",
          args: [balance.owner],
        }),
      ]);
      const percentageClaimed =
        (Number(formatUnits(fameReleased, 18)) * 100) /
        Number(formatUnits(fameAmountTotal, 18));
      const percentClaimedStillHeld =
        fameReleased > 0n
          ? (Number(formatUnits(fameBalance, 18)) /
              Number(formatUnits(fameReleased, 18))) *
            100
          : 100;
      return {
        address: balance.owner,
        amount: BigInt(balance.amount.toString()),
        fameReleasableAmount,
        fameReleased,
        fameAmountTotal,
        percentageClaimed,
        percentClaimedStillHeld,
        fameBalance: BigInt(fameBalance.toString()),
      };
    }),
  );
}
