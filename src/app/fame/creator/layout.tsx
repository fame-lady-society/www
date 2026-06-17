import { DefaultProvider } from "@/context/default";

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultProvider base siwe>{children}</DefaultProvider>;
}
