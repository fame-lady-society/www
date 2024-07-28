import { base, sepolia } from "viem/chains";

export function claimToFameFromNetwork(
  chainId: typeof sepolia.id | typeof base.id,
) {
  switch (chainId) {
    case sepolia.id:
      return "0x4b455Cf06719515bb73b94647a6b56e7924B756e" as const;
    case base.id:
      return "0xD6c1802eF7F59425F388764cA43C2e61c85A117A" as const;
  }
}
