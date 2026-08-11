import type { GalleryHookProjection } from "../types";
import type { GalleryLiquidityProviderPosition } from "./reads";

export function hasLegacyPosition(
  projection: GalleryHookProjection<GalleryLiquidityProviderPosition>,
) {
  return projection.status === "success" && projection.data.unitCount > 0n;
}
