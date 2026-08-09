import type { Metadata } from "next";
import {
  getFameArtworkRevisions,
  getOrderedBurnPoolTokenIds,
} from "@/service/fame";
import { resolveFameMetadata } from "@/features/fame/metadata";
import { FameRotatorPage } from "@/features/fame-rotator/components/FameRotatorPage";
import {
  resolveBurnPoolTarget,
  type BurnPoolTargetResolution,
} from "@/features/fame-rotator/target";

interface Props {
  params: Promise<{ targetId: string }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { targetId } = await props.params;
  return {
    metadataBase: new URL("https://www.fameladysociety.com"),
    title: `Rotate for Society #${targetId} | $FAME`,
    description:
      "Inspect a FAME burn-pool target and prepare a bounded Society NFT rotation.",
  };
}

export default async function Page(props: Props) {
  const { targetId: rawTargetId } = await props.params;

  // Strict parse first so invalid IDs never touch the pool.
  const early = resolveBurnPoolTarget({ rawTargetId });
  if (early.status === "invalid_id") {
    return <FameRotatorPage resolution={early} />;
  }

  let snapshot;
  try {
    snapshot = await getOrderedBurnPoolTokenIds({ cache: "execution" });
  } catch (error) {
    return (
      <FameRotatorPage
        resolution={resolveBurnPoolTarget({
          rawTargetId,
          poolReadError: error,
        })}
      />
    );
  }

  let image: string | undefined;
  const identity = resolveBurnPoolTarget({ rawTargetId, snapshot });
  if (identity.status === "available") {
    try {
      const revisions = await getFameArtworkRevisions(
        [early.tokenId],
        snapshot.blockNumber.toString(),
      );
      const revision = revisions.revisions[0];
      if (revision) {
        const metadata = await resolveFameMetadata(revision);
        if (metadata.status === "ready") image = metadata.image;
      }
    } catch {
      // Artwork is presentation-only and never changes target eligibility.
    }
  }

  const resolution: BurnPoolTargetResolution = resolveBurnPoolTarget({
    rawTargetId,
    snapshot,
    image,
  });
  return <FameRotatorPage resolution={resolution} />;
}

export const dynamic = "force-dynamic";
