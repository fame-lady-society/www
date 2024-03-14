export type Transaction = {
  kind:
    | "mint testnet token"
    | "wrap to"
    | "wrap"
    | "unwrap"
    | "approve collection to be wrapped";
  hash: `0x${string}`;
};
