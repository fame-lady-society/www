import type { Metadata } from "next";
import { AdminWorkbench } from "@/features/fame-gallery/components/AdminWorkbench";

export const metadata: Metadata = {
  title: "TEST gallery admin",
  description: "Operate the Base Sepolia TEST gallery.",
};

export default function Page() {
  return <AdminWorkbench />;
}
