import type { Metadata } from "next";
import {
  getFameTokenImage,
  getOrderedBurnPoolTokenIds,
} from "@/service/fame";
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

  let resolution: BurnPoolTargetResolution;
  try {
    const snapshot = await getOrderedBurnPoolTokenIds({ cache: "display" });
    // Metadata is presentation-only; failure must not remove identity.
    const image = await getFameTokenImage(early.tokenId);
    resolution = resolveBurnPoolTarget({
      rawTargetId,
      snapshot,
      image,
    });
  } catch (error) {
    resolution = resolveBurnPoolTarget({
      rawTargetId,
      poolReadError: error,
    });
  }

  return <FameRotatorPage resolution={resolution} />;
}

export const dynamic = "force-dynamic";
