export type Transaction = {
  kind:
    | "mint testnet token"
    | "wrap to"
    | "wrap"
    | "unwrap"
    | "approve collection to be wrapped"
    | "set wrap cost";
  hash: `0x${string}`;
};
