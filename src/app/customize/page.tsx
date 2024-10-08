import type { Metadata } from "next";
import { RedirectType, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Customize Lady",
  description: "Customize your Fame Lady.",
};

export default async function Page({
  params,
}: {
  params: { network: string };
}) {
  redirect(`/mainnet/customize`, RedirectType.replace);
  return null;
}

export const dynamic = "force-dynamic";
