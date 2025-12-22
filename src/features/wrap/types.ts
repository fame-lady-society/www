export type Transaction<T = unknown> = {
  kind:
    | "mint testnet token"
    | "wrap to"
    | "wrap"
    | "donate"
    | "unwrap"
    | "approve collection to be wrapped"
    | "approve donation vault"
    | "set wrap cost"
    | "update metadata"
    | "launch zora coin";
  hash: `0x${string}`;
  context?: T;
};
