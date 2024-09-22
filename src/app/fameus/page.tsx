import { RedirectWhenConnected } from "@/features/fameus/client-components/RedirectWhenConnected";
import { AppMain } from "@/layouts/AppMain";

export default function Home() {
  return (
    <>
      <AppMain title="FAMEus">
        <section className="flex flex-col items-start justify-center h-full m-4 border rounded-lg p-6">
          <h1 className="text-4xl font-bold">FAMEus</h1>
        </section>
      </AppMain>
      <RedirectWhenConnected pathPrefix="/fameus" />
    </>
  );
}
