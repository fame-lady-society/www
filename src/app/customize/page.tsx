import type { Metadata } from "next";
import Customize from "@/routes/Customize";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Customize Lady",
  description: "Customize your Fame Lady.",
};

export default async function Page({
  params,
}: {
  params: { network: string };
}) {
  return redirect(`/mainnet/customize`);
}

export const dynamic = "force-dynamic";
