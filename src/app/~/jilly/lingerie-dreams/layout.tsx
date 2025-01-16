import { DefaultProvider } from "@/context/default";
import { AppMain } from "@/layouts/AppMain";

export default async function Home({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DefaultProvider polygon>
      <AppMain title="Lingerie Dreams" disableDesktopMenu>
        <div className="w-full px-4 py-8">
          <div className="max-w-4xl mx-auto">{children}</div>
        </div>
      </AppMain>
    </DefaultProvider>
  );
}
