"use client";
import { FC } from "react";
import { useAccount } from "wagmi";
import NextLink from "next/link";
import { base, mainnet, sepolia } from "viem/chains";

export const NetworkMenuItem: FC<{
  path: string;
  disabled: boolean;
  icon: React.ReactNode;
  text: string;
  defaultChainId: typeof base.id | typeof sepolia.id | typeof mainnet.id;
}> = ({ path, disabled, icon, text, defaultChainId }) => {
  const { chain, address } = useAccount();
  const chainId = defaultChainId ?? chain?.id;
  const chainPrefix =
    chainId === mainnet.id
      ? "/mainnet"
      : chainId === base.id
        ? `/${base.name.toLowerCase()}`
        : chainId === sepolia.id
          ? "/sepolia"
          : "";
  const addressPostfix = address ? `/${address}` : "";
  return (
    <NextLink
      href={`${chainPrefix}${path}${addressPostfix}`}
      className={`flex items-center p-2 hover:bg-gray-700 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span className="mr-4 text-white">{icon}</span>
      <span className="text-right text-white">{text}</span>
    </NextLink>
  );
};
