import { sepolia, mainnet } from "viem/chains";

export const useNetworkChain = (network: string) => {
  switch (network) {
    case "mainnet": {
      return mainnet;
    }
    case "sepolia": {
      return sepolia;
    }
    default: {
      return undefined;
    }
  }
};
