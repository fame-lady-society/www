import {
  fameSaleAddress as sepoliaFameSaleAddress,
  fameSaleTokenAddress as sepoliaFameSaleTokenAddress,
} from "@/wagmi";

export function fameSaleAddress(chainId: 11155111 | 8453) {
  return chainId === 11155111
    ? sepoliaFameSaleAddress[chainId]
    : "0x2d78B13a2E735Bc96ec797A37AaF4e17C4431C83";
}

export function fameSaleTokenAddress(chainId: 11155111 | 8453) {
  return chainId === 11155111
    ? sepoliaFameSaleTokenAddress[chainId]
    : "0xf09326082a0B360567c72b6FEd67c22Fe2f76B60";
}
