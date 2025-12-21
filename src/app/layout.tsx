import { type Viewport, type Metadata } from "next";
import "@/styles/tailwind.css";
import { useEffect } from "react";

export const viewport: Viewport = {
  initialScale: 1.0,
  width: "device-width",
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(process.env.OG_BASE_URL!),
    other: {
      "base:app_id": "694779fcd77c069a945be389",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
