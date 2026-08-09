import type { Metadata } from "next";
import { FameRotatorIndexPage } from "@/features/fame-rotator/components/FameRotatorIndexPage";
import { withRotatorSelectorReadDeadline } from "@/features/fame-rotator/selector";
import { getOrderedBurnPoolTokenIds } from "@/service/fame";
import { FameShell } from "@/features/fame/components/FameShell";

export const metadata: Metadata = {
  title: "FAME Rotator",
  description:
    "Choose a waiting Society NFT and prepare a bounded rotation on Base.",
  openGraph: { images: ["/images/fame/gold-leaf.png"] },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  let status: "empty" | "error" | "ready" = "error";
  let targets: { tokenId: number }[] = [];
  let blockNumber = "0";

  try {
    const snapshot = await withRotatorSelectorReadDeadline(
      getOrderedBurnPoolTokenIds({ cache: "execution" }),
    );
    if (snapshot.tokenIds.length === 0) status = "empty";
    else {
      targets = snapshot.tokenIds.map((tokenId) => ({
        tokenId,
      }));
      blockNumber = snapshot.blockNumber.toString();
      status = "ready";
    }
  } catch {
    status = "error";
  }

  return (
    <FameShell title="FAME Rotator" activeFamePage="rotator">
      {status === "ready" ? (
        <FameRotatorIndexPage
          status="ready"
          targets={targets}
          blockNumber={blockNumber}
        />
      ) : (
        <FameRotatorIndexPage status={status} />
      )}
    </FameShell>
  );
}
