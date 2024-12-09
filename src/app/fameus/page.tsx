
import { Metadata } from "next";
import { RedirectType, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "FAMEus",
  description: "FAMEus DAO.",
};


export default function Home() {
  redirect(`/sepolia/fameus`, RedirectType.replace);
}
