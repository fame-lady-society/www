import type { Metadata } from "next";
import Fame from "@/routes/Fame";

export const metadata: Metadata = {
  title: "$FAME",
  description: "The home of $FAME.",
};

export default async function Page({}: {}) {
  return <Fame />;
}
