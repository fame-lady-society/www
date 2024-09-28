import type { Metadata } from "next";
import Customize from "@/routes/Customize";
import { redirect } from "next/navigation";
import { RedirectType } from "next/navigation";

export const metadata: Metadata = {
  title: "Customize Lady",
  description: "Customize your Fame Lady.",
};

export default async function Page({
  params,
}: {
  params: { tokenId: string; network: string };
}) {
  const { tokenId, network } = params;
  switch (network) {
    case "sepolia": {
      return <Customize prefix="/sepolia/customize" network="sepolia" />;
    }
    case "mainnet": {
      return <Customize prefix="/mainnet/customize" network="mainnet" />;
    }
    default: {
      redirect(`/mainnet/customize`, RedirectType.replace);
    }
  }
}

export const dynamic = "force-dynamic";
