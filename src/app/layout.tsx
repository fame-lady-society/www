import type { Metadata } from "next";
import "./globals.css";

const metadata: Metadata = {
  metadataBase: new URL(process.env.OG_BASE_URL!),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
