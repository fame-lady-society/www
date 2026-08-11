import { Metadata } from "next";
import { RedirectType, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "FAMEus Recovery",
  description:
    "FAMEus governance is paused. Legacy recovery remains available for existing holders.",
};

export default function Home() {
  redirect(`/base/fameus`, RedirectType.replace);
}
