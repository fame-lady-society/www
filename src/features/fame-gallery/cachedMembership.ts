import { unstable_cache } from "next/cache";
import {
  readFameGalleryMembership,
  type FameGalleryMembershipSnapshot,
} from "./membership";

export const FAME_GALLERY_MEMBERSHIP_TTL_MS = 300_000;

const readCachedMembership = unstable_cache(
  () => readFameGalleryMembership(),
  ["fame-gallery-membership", "8453"],
  { revalidate: FAME_GALLERY_MEMBERSHIP_TTL_MS / 1000 },
);

export async function getCachedFameGalleryMembership(): Promise<FameGalleryMembershipSnapshot> {
  return readCachedMembership();
}
