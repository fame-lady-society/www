import NextImage from "next/image";

export type BurnPoolToken = {
  tokenId: number;
  image: string;
};

export function BurnPoolImage({ tokenId, image }: BurnPoolToken) {
  return (
    <NextImage
      src={image}
      alt={`Burned token ${tokenId}`}
      width={400}
      height={400}
      sizes="(min-width: 900px) 25vw, 50vw"
    />
  );
}
