import type { Metadata } from "next";
import FameAdmin from "@/routes/FameAdmin";

export const metadata: Metadata = {
  title: "Fame admin page",
  description: "Admin page for Fame token launch",
};

export default async function Page({}: {}) {
  return <FameAdmin />;
}

export const dynamic = "force-dynamic";
