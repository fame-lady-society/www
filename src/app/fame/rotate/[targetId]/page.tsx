import type { Metadata } from "next";
import Link from "next/link";
import NextImage from "next/image";
import {
  getFameTokenImage,
  getOrderedBurnPoolTokenIds,
} from "@/service/fame";
import {
  ROTATION_EXCHANGE_EXPLANATION,
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
    return <RotateTargetShell resolution={early} />;
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

  return <RotateTargetShell resolution={resolution} />;
}

function RotateTargetShell({
  resolution,
}: {
  resolution: BurnPoolTargetResolution;
}) {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "2rem 1.25rem 4rem",
        color: "var(--foreground, #f5f5f5)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <p style={{ marginBottom: "1rem" }}>
        <Link href="/fame" style={{ color: "inherit" }}>
          ← Back to $FAME
        </Link>
      </p>

      {resolution.status === "invalid_id" && (
        <section aria-labelledby="rotate-invalid-heading">
          <h1 id="rotate-invalid-heading">Invalid target</h1>
          <p>
            The rotation route accepts only canonical positive Society token
            IDs from 1 to 888.{" "}
            <code>{resolution.raw || "(empty)"}</code> is not a valid target
            id.
          </p>
          <p>
            <Link href="/fame">Return to the burn pool</Link>
          </p>
        </section>
      )}

      {resolution.status === "unavailable" && (
        <section aria-labelledby="rotate-unavailable-heading">
          <h1 id="rotate-unavailable-heading">
            Society #{resolution.tokenId} is not in the burn pool
          </h1>
          <p>
            That token is a valid Society id, but it is not currently in the
            FIFO burn pool. It may already have been minted or rotated by
            someone else.
          </p>
          <p>
            <Link href={resolution.returnHref}>Return to the burn pool</Link>
          </p>
        </section>
      )}

      {resolution.status === "retryable_read_failure" && (
        <section aria-labelledby="rotate-retry-heading">
          <h1 id="rotate-retry-heading">
            Could not read the burn pool for Society #{resolution.tokenId}
          </h1>
          <p>
            A temporary read failure prevented confirming whether this target
            is still available. This is not the same as the token being absent
            from the pool.
          </p>
          <p style={{ opacity: 0.8 }}>{resolution.message}</p>
          <p>
            <Link href={`/fame/rotate/${resolution.tokenId}`}>
              Retry this target
            </Link>
            {" · "}
            <Link href="/fame">Return to the burn pool</Link>
          </p>
        </section>
      )}

      {resolution.status === "available" && (
        <section aria-labelledby="rotate-available-heading">
          <h1 id="rotate-available-heading">
            Rotate for Society #{resolution.tokenId}
          </h1>

          <div
            style={{
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "minmax(0, 200px) minmax(0, 1fr)",
              alignItems: "start",
              margin: "1.5rem 0",
            }}
          >
            <NextImage
              src={resolution.image}
              alt={`Society NFT ${resolution.tokenId}`}
              width={200}
              height={200}
              style={{ width: "100%", height: "auto", borderRadius: 8 }}
            />
            <dl style={{ margin: 0 }}>
              <dt style={{ opacity: 0.7, fontSize: "0.85rem" }}>Target</dt>
              <dd style={{ margin: "0 0 0.75rem", fontWeight: 700 }}>
                Society #{resolution.tokenId}
              </dd>
              <dt style={{ opacity: 0.7, fontSize: "0.85rem" }}>
                FIFO position
              </dt>
              <dd style={{ margin: "0 0 0.75rem", fontWeight: 700 }}>
                {resolution.position}
              </dd>
              <dt style={{ opacity: 0.7, fontSize: "0.85rem" }}>
                Rotation bound
              </dt>
              <dd style={{ margin: 0, fontWeight: 700 }}>
                {resolution.maxRotations}
              </dd>
            </dl>
          </div>

          <p>{ROTATION_EXCHANGE_EXPLANATION}</p>
          <p style={{ opacity: 0.75, fontSize: "0.9rem" }}>
            Wallet connection, offered-token selection, approval, and rotation
            will appear here in a later step. You can inspect this target while
            disconnected.
          </p>
        </section>
      )}
    </main>
  );
}

export const dynamic = "force-dynamic";
