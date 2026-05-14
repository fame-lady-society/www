export type FameQuoteContext =
  | {
      source: "live";
      chainId: number;
      blockNumber: bigint;
    }
  | {
      source: "fork";
      chainId: number;
      blockNumber: bigint;
      forkUrlLabel?: string;
    }
  | {
      source: "snapshot";
      snapshotId: string;
      pinnedBaseBlock: number;
    }
  | {
      source: "deterministic_test";
      profileId: string;
    };

export function quoteContextLabel(context: FameQuoteContext): string {
  switch (context.source) {
    case "live":
      return `live:${context.chainId}:${context.blockNumber.toString()}`;
    case "fork":
      return `fork:${context.chainId}:${context.blockNumber.toString()}`;
    case "snapshot":
      return `recorded:${context.snapshotId}:${context.pinnedBaseBlock}`;
    case "deterministic_test":
      return `deterministic-test:${context.profileId}`;
  }
}
