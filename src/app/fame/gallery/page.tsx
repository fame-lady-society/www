import { connection } from "next/server";
import { getCachedFameGalleryMembership } from "@/features/fame-gallery/cachedMembership";
import {
  getCachedFameGalleryStatuses,
  presentFameGalleryStatuses,
} from "@/features/fame-gallery/cachedStatus";
import { isFreshFameGalleryMembership } from "@/features/fame-gallery/membership";
import { FameGalleryPage, FameGalleryUnavailable } from "@/features/fame-gallery/components/FameGalleryPage";

async function readGalleryPresentation() {
  try {
    const membership = await getCachedFameGalleryMembership();
    if (!isFreshFameGalleryMembership(membership)) return null;
    try {
      const status = await getCachedFameGalleryStatuses(
        membership.visibleTokenIds,
        membership.fingerprint,
      );
      const presentation = presentFameGalleryStatuses(status, membership.fingerprint);
      return {
        tokenIds: membership.visibleTokenIds,
        ...presentation,
      };
    } catch {
      return {
        tokenIds: membership.visibleTokenIds,
        ...presentFameGalleryStatuses(null, membership.fingerprint),
      };
    }
  } catch {
    return null;
  }
}

export default async function Page() {
  await connection();
  const presentation = await readGalleryPresentation();
  if (!presentation) return <FameGalleryUnavailable />;
  return <FameGalleryPage {...presentation} />;
}
