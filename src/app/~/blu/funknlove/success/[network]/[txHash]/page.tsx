"use client";
import { useTransactionReceipt } from "wagmi";
import { mainnet, sepolia } from "viem/chains";
import { parseEventLogs, zeroAddress } from "viem";
import { funknloveAbi } from "@/wagmi";
import { useMemo } from "react";
import NextImage from "next/image";
import { WrappedLink } from "@/components/WrappedLink";

const bronzeUrl = "/~/blu/funknlove/bronzefnl.png";
const silverUrl = "/~/blu/funknlove/silverfnl.png";
const goldUrl = "/~/blu/funknlove/goldfnl.png";

export default function Page({
  params,
}: {
  params: { txHash: string; network: string };
}) {
  const { txHash, network } = params;
  const chainId = network === "mainnet" ? mainnet.id : sepolia.id;
  const etherscanUrl = `https://${chainId === mainnet.id ? "etherscan.io" : "sepolia.etherscan.io"}/tx/${txHash}`;
  const { data: tx } = useTransactionReceipt({
    hash: txHash as `0x${string}`,
    chainId,
  });
  // use viem to decode the logs in the tx
  const { bronzeTokenIds, silverTokenIds, goldTokenIds } = useMemo(() => {
    if (!tx)
      return {
        bronzeTokenIds: [],
        silverTokenIds: [],
        goldTokenIds: [],
      };
    const logs = parseEventLogs({
      abi: funknloveAbi,
      logs: tx.logs,
    });
    // Only mint events are relevant
    let batchLogs: any[] = logs.filter(
      (log) => log.eventName === "TransferBatch",
    );
    batchLogs = batchLogs.filter((log) => log.args.from === zeroAddress);
    let singleLogs: any[] = logs.filter(
      (log) => log.eventName === "TransferSingle",
    );
    singleLogs = singleLogs.filter((log) => log.args.from === zeroAddress);
    const allTokenIds = [
      ...batchLogs.map((log) => log.args.ids).flat(),
      ...singleLogs.map((log) => log.args.id),
    ];
    const bronzeTokenIds = allTokenIds.filter((id) => id === 0n);
    const silverTokenIds = allTokenIds.filter((id) => id === 1n);
    const goldTokenIds = allTokenIds.filter((id) => id === 2n);
    return {
      bronzeTokenIds,
      silverTokenIds,
      goldTokenIds,
    };
  }, [tx]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-2xl w-full bg-gray-800 rounded-xl shadow-lg p-8 space-y-8 border border-gray-700">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Success!</h1>
          <p className="text-lg text-gray-300">
            Your transaction has been successfully sent to the network.
          </p>
          <p className="text-gray-300">
            You can view the transaction on{" "}
            <a
              href={etherscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Etherscan
            </a>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bronzeTokenIds.length > 0 && (
            <div className="flex flex-col items-center gap-3 p-4 bg-gray-700 rounded-lg border border-gray-600">
              <p className="text-lg font-medium text-gray-200">Bronze Tokens</p>
              <p className="text-2xl font-bold text-amber-400">
                {bronzeTokenIds.length}
              </p>
              <NextImage
                src={bronzeUrl}
                alt="Bronze"
                width={120}
                height={120}
                className="rounded-lg"
              />
            </div>
          )}
          {silverTokenIds.length > 0 && (
            <div className="flex flex-col items-center gap-3 p-4 bg-gray-700 rounded-lg border border-gray-600">
              <p className="text-lg font-medium text-gray-200">Silver Tokens</p>
              <p className="text-2xl font-bold text-gray-300">
                {silverTokenIds.length}
              </p>
              <NextImage
                src={silverUrl}
                alt="Silver"
                width={120}
                height={120}
                className="rounded-lg"
              />
            </div>
          )}
          {goldTokenIds.length > 0 && (
            <div className="flex flex-col items-center gap-3 p-4 bg-gray-700 rounded-lg border border-gray-600">
              <p className="text-lg font-medium text-gray-200">Gold Tokens</p>
              <p className="text-2xl font-bold text-yellow-400">
                {goldTokenIds.length}
              </p>
              <NextImage
                src={goldUrl}
                alt="Gold"
                width={120}
                height={120}
                className="rounded-lg"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <WrappedLink
            href={`https://x.com/intent/tweet?text=${"I just joined the Fame Lady Society in fighting human trafficking by donating to Exodus Road\n\n(I also got a pretty cool music NFT"}&url=https://www.fameladysociety.com/~/blu/funknlove`}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-center border border-gray-600 no-underline"
            target="_blank"
          >
            Share on X
          </WrappedLink>
          <WrappedLink
            href={`https://warpcast.com/~/compose?text=${"I just joined the Fame Lady Society in fighting human trafficking by donating to Exodus Road\n\n(I also got a pretty cool music NFT"}&embeds[]=https://www.fameladysociety.com/~/blu/funknlove`}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-center border border-gray-600 no-underline"
            target="_blank"
          >
            Share on Farcaster
          </WrappedLink>
        </div>
      </div>
    </div>
  );
}
