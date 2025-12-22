import "./client";
import { Address } from "viem";
import { createCoin } from "./client";
import { fameFromNetwork } from "@/features/fame/contract";
import { base } from "viem/chains";

export const debugCreateCoin = async ({
  creator,
  imageURI,
  name,
  symbol,
  description,
}: {
  creator: Address;
  imageURI: string;
  name: string;
  symbol: string;
  description: string;
}) => {
  const coin = await createCoin({
    creator,
    imageURI,
    currency: fameFromNetwork(base.id),
    name,
    symbol,
    description,
  });
  console.log(coin);
  return coin;
};
