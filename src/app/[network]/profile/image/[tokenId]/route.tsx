import { ImageResponse } from "@vercel/og";
import { type ReactElement } from "react";
import { client as mainnetClient } from "@/viem/mainnet-client";
import { client as baseSepoliaClient } from "@/viem/base-sepolia-client";
import { client as sepoliaClient } from "@/viem/sepolia-client";
import {
  fameLadySocietyAbi,
  fameLadySocietyAddress,
  flsNamingAbi,
  flsNamingAddress,
} from "@/wagmi";
import { fetchJson } from "@/ipfs/client";
import { type IMetadata } from "@/utils/metadata";
import { baseSepolia, mainnet, sepolia } from "viem/chains";

export const runtime = "edge";

type SupportedNetwork = "mainnet" | "base-sepolia" | "sepolia";

interface NetworkConfig {
  network: SupportedNetwork;
  client: typeof mainnetClient | typeof sepoliaClient | typeof baseSepoliaClient;
  address: `0x${string}`;
  chainId: number;
}

function resolveNetwork(network: string): NetworkConfig | null {
  if (network === "mainnet") {
    const address = flsNamingAddress[mainnet.id];
    if (!address) {
      return null;
    }
    return { network: "mainnet", client: mainnetClient, address, chainId: mainnet.id };
  }
  if (network === "base-sepolia") {
    const address = flsNamingAddress[baseSepolia.id];
    if (!address) {
      return null;
    }
    return {
      network: "base-sepolia",
      client: baseSepoliaClient,
      address,
      chainId: baseSepolia.id,
    };
  }
  if (network === "sepolia") {
    const address = flsNamingAddress[sepolia.id];
    if (!address) {
      return null;
    }
    return { network: "sepolia", client: sepoliaClient, address, chainId: sepolia.id };
  }
  return null;
}

const LIPS_URL =
  process.env.FLS_LIPS_URL ?? "https://fameladysociety.com/images/app.png";

const FLS_PFP_IMAGE_BASE = "https://fame.support/fls/thumb/";

const SIZE = 1080;

const COLOR_BG = "#000000";
const COLOR_WHITE = "#FFFFFF";
const COLOR_GOLD = "#D4AF37";

function parseTokenId(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function clampName(raw: string, maxChars: number): string {
  const normalized = raw.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxChars - 1))}…`;
}

// function removeTokenIdFromName(name: string, tokenIdText: string): string {
//   if (!name.includes(tokenIdText)) {
//     return name;
//   }
//   return name.replaceAll(tokenIdText, "").replace(/\s+/g, " ").trim();
// }

// function ensureTokenIdInName(name: string, tokenIdText: string): string {
//   const normalized = name.replace(/\s+/g, " ").trim();
//   if (normalized.includes(tokenIdText)) {
//     return normalized;
//   }
//   if (normalized.length === 0) {
//     return tokenIdText;
//   }
//   return `${normalized} ${tokenIdText}`;
// }

async function resolveBoundPfpImageUrl(
  primaryTokenId: bigint,
): Promise<string> {
  const base = FLS_PFP_IMAGE_BASE.endsWith("/")
    ? FLS_PFP_IMAGE_BASE.slice(0, -1)
    : FLS_PFP_IMAGE_BASE;
  return `${base}/${primaryTokenId.toString()}`;
}

async function resolveBoundTokenName(
  client: typeof mainnetClient | typeof sepoliaClient | typeof baseSepoliaClient,
  chainId: number,
  primaryTokenId: bigint,
): Promise<string> {
  const address = fameLadySocietyAddress[chainId];
  if (!address) {
    return "";
  }

  const tokenUri = await client.readContract({
    address,
    abi: fameLadySocietyAbi,
    functionName: "tokenURI",
    args: [primaryTokenId],
  });

  if (typeof tokenUri !== "string") {
    return "";
  }

  if (tokenUri.startsWith("ipfs://")) {
    const metadata = await fetchJson<IMetadata>({
      cid: tokenUri.replace("ipfs://", ""),
    });
    return metadata.name ?? "";
  }

  const response = await fetch(tokenUri);
  const metadata = (await response.json()) as IMetadata;
  return metadata.name ?? "";
}

function CircuitBorderSvg(props: {
  seed: number;
  inset: number;
  strokeWidth: number;
}): ReactElement {
  const rand = mulberry32(props.seed);
  const x0 = props.inset;
  const y0 = props.inset;
  const w = SIZE - props.inset * 2;
  const h = SIZE - props.inset * 2;
  const fleckCount = 14;
  const flecks: Array<ReactElement> = [];

  for (let i = 0; i < fleckCount; i += 1) {
    const edge = Math.floor(rand() * 4);
    const t = rand();
    const r = 0.8 + rand() * 1.4;
    const opacity = 0.08 + rand() * 0.12;

    let cx = x0;
    let cy = y0;

    if (edge === 0) {
      cx = x0 + t * w;
      cy = y0;
    } else if (edge === 1) {
      cx = x0 + w;
      cy = y0 + t * h;
    } else if (edge === 2) {
      cx = x0 + t * w;
      cy = y0 + h;
    } else {
      cx = x0;
      cy = y0 + t * h;
    }

    flecks.push(
      <circle
        // eslint-disable-next-line react/no-array-index-key
        key={`f-${i}`}
        cx={cx}
        cy={cy}
        r={r}
        fill={COLOR_GOLD}
        opacity={opacity}
      />,
    );
  }


  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{
        position: "absolute",
        inset: 0,
      }}
    >
      <rect
        x={x0}
        y={y0}
        width={w}
        height={h}
        rx={22}
        ry={22}
        fill="none"
        stroke={COLOR_WHITE}
        strokeWidth={props.strokeWidth}
        opacity={0.92}
      />

      <path
        d={[
          `M ${x0 + w * 0.1} ${y0} L ${x0 + w * 0.22} ${y0}`,
          `M ${x0 + w} ${y0 + h * 0.18} L ${x0 + w} ${y0 + h * 0.3}`,
          `M ${x0 + w * 0.68} ${y0 + h} L ${x0 + w * 0.86} ${y0 + h}`,
          `M ${x0} ${y0 + h * 0.7} L ${x0} ${y0 + h * 0.84}`,
        ].join(" ")}
        fill="none"
        stroke={COLOR_WHITE}
        strokeWidth={props.strokeWidth}
        opacity={0.75}
        strokeLinecap="round"
      />

      {flecks}
    </svg>
  );
}

export async function GET(
  req: Request,
  { params }: { params: { tokenId: string; network: string } },
): Promise<Response> {
  const config = resolveNetwork(params.network);
  if (!config) {
    return new Response("Not Found", { status: 404 });
  }

  const tokenId = parseTokenId(params.tokenId);
  if (tokenId === null) {
    return new Response("Invalid tokenId", { status: 400 });
  }

  const { address: contractAddress, client: viemClient, chainId } = config;

  let identityName = "";
  let primaryTokenId = 0n;

  try {
    const result = await viemClient.readContract({
      address: contractAddress,
      abi: flsNamingAbi,
      functionName: "getIdentity",
      args: [BigInt(tokenId)],
    });
    identityName = result[0];
    primaryTokenId = result[2];
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            width: SIZE,
            height: SIZE,
            display: "flex",
            backgroundColor: COLOR_BG,
            color: COLOR_WHITE,
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: 1,
            fontFamily: "Helvetica Neue, Arial, sans-serif",
          }}
        >
          NOT FOUND
        </div>
      ),
      {
        width: SIZE,
        height: SIZE,
      },
    );
  }

  const portraitUrl = await resolveBoundPfpImageUrl(primaryTokenId);
  const canonicalDefaultName = `Fame Lady #${primaryTokenId.toString()}`;
  const tokenIdText = `#${primaryTokenId.toString()}`;
  
  const boundTokenName = await resolveBoundTokenName(
    viemClient,
    chainId,
    primaryTokenId,
  );

  const line1 = clampName(identityName, 64);
  const line2 = clampName(boundTokenName === canonicalDefaultName ? `My Fame Lady: ${boundTokenName}` : `My Fame Lady: ${boundTokenName} (${tokenIdText})`, 72);

  const borderInset = 30;
  const borderStroke = 4;
  const portraitSize = 740;
  const portraitRadius = 12;
  const nameSize = 64;
  const subSize = 32;
  const lipsSize = 92;

  return new ImageResponse(
    (
      <div
        style={{
          width: SIZE,
          height: SIZE,
          position: "relative",
          backgroundColor: COLOR_BG,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          fontFamily: "Helvetica Neue, Arial, sans-serif",
        }}
      >
        <CircuitBorderSvg
          seed={tokenId}
          inset={borderInset}
          strokeWidth={borderStroke}
        />

        <img
          src={LIPS_URL}
          width={lipsSize}
          height={lipsSize}
          alt="FLS lips"
          style={{
            position: "absolute",
            top: 44,
            left: 44,
          }}
        />

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 104,
          }}
        >
          <div
            style={{
              width: portraitSize,
              height: portraitSize,
              borderRadius: portraitRadius,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0A0A0A",
            }}
          >
            <img
              src={portraitUrl}
              width={portraitSize}
              height={portraitSize}
              alt={`Fame Lady #${primaryTokenId.toString()}`}
              style={{
                width: portraitSize,
                height: portraitSize,
                objectFit: "cover",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 38,
              width: 820,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              color: COLOR_WHITE,
            }}
          >
            <div
              style={{
                fontSize: nameSize,
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: "uppercase",
                lineHeight: 1,
                width: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {line1}
            </div>

            {line2.length > 0 ? (
              <div
                style={{
                  marginTop: 18,
                  fontSize: subSize,
                  fontWeight: 500,
                  letterSpacing: 0.6,
                  color: "rgba(255,255,255,0.78)",
                  lineHeight: 1,
                  width: "100%",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {line2}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ),
    {
      width: SIZE,
      height: SIZE,
    },
  );
}
