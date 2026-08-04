import type { GalleryLiquidityToken } from "./reads";

export type GalleryLiquidityTokenListState =
  | Readonly<{ status: "disconnected" }>
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "empty" }>
  | Readonly<{ status: "error"; message: string }>
  | Readonly<{
      status: "ready";
      tokens: readonly GalleryLiquidityToken[];
    }>;

export type GalleryLiquidityProviderViewState =
  | Readonly<{ status: "disconnected" }>
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "error"; message: string }>
  | Readonly<{ status: "ready"; unitCount: bigint }>;
