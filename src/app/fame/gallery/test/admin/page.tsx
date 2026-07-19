import type { Metadata } from "next";
import { AdminWorkbench } from "@/features/fame-gallery/components/AdminWorkbench";

export const metadata: Metadata = {
  title: "TEST marketplace admin",
  description: "Operate the Base Sepolia Universal Pool Art Marketplace.",
};

export default function Page() {
  return <AdminWorkbench />;
}
