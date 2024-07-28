import { sepolia, base } from "viem/chains";

export function fameVestingFromNetwork(chainId: number) {
  switch (chainId) {
    case sepolia.id:
      return "0x58d1a0DD3F3F7962C61433a320A09183e3BDb592";
    case base.id:
      return "0xf9301c6b2c6eF4F74f16d009C654097cbAdC95D2";
    default:
      return undefined;
  }
}
