/* eslint-disable react/jsx-key */
import { NextRequest, NextResponse } from "next/server";
import { baseUrl, frames } from "@/app/frames/frames";
import { Button } from "frames.js/next";

type Params = { network: string; tokenId: string };

const handleRequest = ({ network, tokenId }: Params) =>
  frames((ctx) => {
    return {
      image: `${baseUrl}/${network}/og/token/${tokenId}`,
      buttons: [
        <Button action="link" target={`${baseUrl}/${network}/token/${tokenId}`}>
          details
        </Button>,
      ],
    };
  });

export const GET = async (req: NextRequest, props: { params: Promise<Params> }) => {
  const params = await props.params;
  return handleRequest(params)(req);
};
export const POST = async (req: NextRequest, props: { params: Promise<Params> }) => {
  const params = await props.params;
  return handleRequest(params)(req);
};
