import { useChainId } from "wagmi";
import {
  bulkMinterAbi,
  bulkMinterAddress,
  wrappedNftAbi,
  wrappedNftAddress,
  fameLadySquadAbi,
  fameLadySquadAddress,
  fameLadySocietyAbi,
  fameLadySocietyAddress,
} from "@/wagmi";

export function useChainContracts() {
  const chainId = useChainId();
  const targetContractAbi = chainId === 1 ? fameLadySquadAbi : bulkMinterAbi;
  const targetContractAddress =
    chainId === 1
      ? fameLadySquadAddress[chainId]
      : chainId === 11155111
        ? bulkMinterAddress[chainId]
        : undefined;
  const wrappedNftContractAbi =
    chainId === 1 ? wrappedNftAbi : fameLadySocietyAbi;
  const wrappedNftContractAddress =
    chainId === 1
      ? fameLadySocietyAddress[chainId]
      : chainId === 11155111
        ? wrappedNftAddress[chainId]
        : undefined;
  return {
    targetContractAbi,
    targetContractAddress,
    wrappedNftContractAbi,
    wrappedNftContractAddress,
  };
}
