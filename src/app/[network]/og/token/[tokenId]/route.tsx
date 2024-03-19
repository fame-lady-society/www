/* eslint-disable @next/next/no-img-element */
import { asNetwork } from "@/routes/utils";
import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "@vercel/og";
import {
  client as mainnetClient,
  flsTokenAddress as mainnetFlsTokenAddress,
} from "@/viem/mainnet-client";
import {
  client as sepoliaClient,
  flsTokenAddress as sepoliaFlsTokenAddress,
} from "@/viem/sepolia-client";
import { erc721Abi } from "viem";
import { IMetadata, defaultDescription, imageUrl } from "@/utils/metadata";
import { fetchJson } from "@/ipfs/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { tokenId: string; network: string } },
) {
  const network = asNetwork(params.network);
  if (network === null) {
    console.log("network not found");
    return new NextResponse("Not Found", { status: 404 });
  }
  const viemClient = network === "mainnet" ? mainnetClient : sepoliaClient;
  const flsTokenAddress =
    network === "mainnet" ? mainnetFlsTokenAddress : sepoliaFlsTokenAddress;

  const tokenId = params.tokenId;

  try {
    const [[owner, ensName, ensAvatar], metadata] = await Promise.all([
      viemClient
        .readContract({
          abi: erc721Abi,
          address: flsTokenAddress,
          functionName: "ownerOf",
          args: [BigInt(tokenId)],
        })
        .then(async (owner) => {
          const ensName = await viemClient.getEnsName({
            address: owner,
          });
          const ensAvatar = ensName
            ? await viemClient.getEnsAvatar({
                name: ensName,
              })
            : null;
          return [owner, ensName, ensAvatar];
        }),
      viemClient
        .readContract({
          abi: erc721Abi,
          address: flsTokenAddress,
          functionName: "tokenURI",
          args: [BigInt(tokenId)],
        })
        .then(async (tokenUri) => {
          const metadata = await fetchJson<IMetadata>({
            cid: tokenUri.replace("ipfs://", ""),
          });
          return metadata;
        }),
    ]);
    const chunks = metadata.description?.split(defaultDescription);
    let description: string | null = null;
    if (chunks && chunks.length > 1) {
      description = chunks[0].trim();
    }
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
              width: "50%",
              height: "100%",
              backgroundColor: "slate-700",
              justifyContent: "center",
              backgroundImage: `url('${imageUrl(tokenId)}')`,
              backgroundSize: "100% 100%",
              color: "black",
              fontFamily: "Roboto",
              fontWeight: 400,
              // red border
              border: "8px solid red",
            }}
          />
          <div
            style={{
              display: "flex",
              width: "50%",
              height: "100%",
              backgroundColor: "white",
              justifyContent: "center",
              backgroundSize: "100% 100%",
              color: "black",
              fontFamily: "Roboto",
              fontWeight: 400,
              // red border
              borderTop: "8px solid red",
              borderBottom: "8px solid red",
              borderRight: "8px solid red",
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  alignContent: "flex-start",
                  width: "100%",
                }}
              >
                {ensAvatar && (
                  <img
                    src={ensAvatar}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      alignSelf: "center",
                      justifySelf: "flex-end",
                      marginLeft: "24px",
                    }}
                    alt=""
                  />
                )}
                <h1
                  style={{
                    alignSelf: "flex-start",
                    marginLeft: "24px",
                    // shadow
                    textShadow: "2px 2px 6px #000000",
                  }}
                >
                  {metadata.name}
                </h1>
              </div>
              {ensName ? (
                <p
                  style={{
                    alignSelf: "flex-start",
                    marginLeft: "24px",
                    fontSize: "32px",
                  }}
                >
                  {ensName}
                </p>
              ) : (
                <p
                  style={{
                    fontSize: "18px",
                    alignSelf: "flex-start",
                    marginLeft: "24px",
                  }}
                >
                  {owner}
                </p>
              )}
              <p
                style={{
                  fontSize: 20,
                  paddingLeft: "24px",
                  paddingRight: "24px",
                  width: "100%",
                }}
              >
                {description ? description : defaultDescription}
              </p>
            </div>
          </div>
        </div>
      ),
      {
        width: 1100,
        height: 576,
      },
    );
  } catch (error) {
    // no owner, token does not exist
    // do better
    return new NextResponse("Not Found", { status: 404 });
  }
}

export const dynamic = "force-dynamic";
