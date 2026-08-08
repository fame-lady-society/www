import "./fame.css";
import { FameEmotionRegistry } from "./FameEmotionRegistry";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FameEmotionRegistry>{children}</FameEmotionRegistry>;
}
