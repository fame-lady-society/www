import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import {
  fameMarketOgArtworkUrl,
  fameMarketTokenName,
  getFameMarketTokenPresentation,
  parseFameMarketTokenId,
} from "@/features/fame-market/tokenPresentation";

export const alt = "FAME Marketplace artwork";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ tokenId: string }>;
}) {
  const tokenId = parseFameMarketTokenId((await params).tokenId);
  if (tokenId === null) notFound();

  const presentation = await getFameMarketTokenPresentation(tokenId);
  const name = fameMarketTokenName(presentation);
  const artwork = fameMarketOgArtworkUrl(presentation.metadata.image);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "stretch",
          background: "#0d0c0a",
          color: "#f4eee2",
          padding: 42,
        }}
      >
        <div
          style={{
            width: 546,
            height: 546,
            display: "flex",
            position: "relative",
            overflow: "hidden",
            background: "#16140f",
            border: "1px solid rgba(201,170,103,0.45)",
          }}
        >
          <img
            src={artwork}
            alt=""
            width="546"
            height="546"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "18px 28px 18px 58px",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#c9aa67",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.18em",
            }}
          >
            FAME / MARKET
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontFamily: "serif",
                fontSize: name.length > 40 ? 54 : 68,
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
              }}
            >
              {name}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#e4cd96",
            }}
          >
            FAME Marketplace on Base
          </div>
        </div>
      </div>
    ),
    size,
  );
}
