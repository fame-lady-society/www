import { FameRotatorIndexPage } from "@/features/fame-rotator/components/FameRotatorIndexPage";
import {
  getRotatorSelectorImagePath,
  withRotatorSelectorReadDeadline,
} from "@/features/fame-rotator/selector";
import { getOrderedBurnPoolTokenIds } from "@/service/fame";

export default async function Page() {
  let status: "empty" | "error" | "ready" = "error";
  let targets: { tokenId: number; image: string }[] = [];

  try {
    const snapshot = await withRotatorSelectorReadDeadline(
      getOrderedBurnPoolTokenIds({ cache: "display" }),
    );
    if (snapshot.tokenIds.length === 0) status = "empty";
    else {
      targets = snapshot.tokenIds.map((tokenId) => ({
        tokenId,
        image: getRotatorSelectorImagePath(tokenId),
      }));
      status = "ready";
    }
  } catch {
    status = "error";
  }

  return <FameRotatorIndexPage status={status} targets={targets} />;
}
