import { connection } from "next/server";
import {
  readFameGalleryCatalog,
  serializeFameGalleryCatalog,
} from "@/features/fame-gallery/catalog";
import {
  FameGalleryPage,
  FameGalleryUnavailable,
} from "@/features/fame-gallery/components/FameGalleryPage";
import { FameShell } from "@/features/fame/components/FameShell";

async function readGalleryPresentation() {
  try {
    return serializeFameGalleryCatalog(await readFameGalleryCatalog());
  } catch {
    return null;
  }
}

export default async function Page() {
  await connection();
  const presentation = await readGalleryPresentation();
  return (
    <FameShell title="FAME Gallery" activeFamePage="gallery">
      {presentation ? (
        <FameGalleryPage page={presentation} />
      ) : (
        <FameGalleryUnavailable />
      )}
    </FameShell>
  );
}
