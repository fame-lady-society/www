/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { NextRequest } from "next/server";
import { ImageResponse } from "@vercel/og";

import { getFlsPoolAllocation } from "@/features/claim/hooks/useSnapshot";

import { formatEther } from "viem";
import { baseUrl } from "@/app/frames/frames";

function formatUnit(amount: bigint) {
  return Math.floor(Number(formatEther(amount)));
}

export async function GET(
  req: NextRequest,
  { params }: { params: { tokenId: string } },
) {
  const flsPoolAllocation = getFlsPoolAllocation(3, 1.5);
  const allocation = flsPoolAllocation.get(Number(params.tokenId))!;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          width: "100%",
          height: "100vh",
          backgroundColor: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            backgroundColor: "white",
            justifyContent: "center",
            backgroundSize: "100% 100%",
            color: "black",
            fontFamily: "Roboto",
            fontWeight: 400,
            // red border
            border: "8px solid red",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              color: "black",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <img
              src={`${baseUrl}/images/fame/banner.png`}
              style={{
                width: "100%",
                height: "35%",
              }}
            />
            <div
              style={{
                display: "block",
                flexGrow: 1,
              }}
            ></div>
            <p
              style={{
                fontSize: "64px",
                paddingLeft: "24px",
                paddingRight: "24px",
                width: "100%",
                margin: "0.125em 0",
              }}
            >
              {formatUnit(allocation).toLocaleString()} $FAME
            </p>

            <div
              style={{
                display: "block",
                flexGrow: 1,
              }}
            ></div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1100,
      height: 1100,
    },
  );
}

export const dynamic = "force-dynamic";