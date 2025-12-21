import { type Viewport, type Metadata } from "next";
import "@/styles/tailwind.css";

export const viewport: Viewport = {
  initialScale: 1.0,
  width: "device-width",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.OG_BASE_URL ?? "https://www.fameladysociety.com",
  ),
  other: {
    "base:app_id": "694779fcd77c069a945be389",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
