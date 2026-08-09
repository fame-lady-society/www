export type FameArtworkRevision = Readonly<{
  tokenId: string;
  tokenUri: string;
  artworkHash?: `0x${string}`;
}>;

export type FameMetadataAttribute = {
  traitType: string;
  value: string;
};

export type FameMetadataResult =
  | Readonly<{
      status: "ready";
      image: string;
      name: string | null;
      description: string | null;
      attributes: FameMetadataAttribute[];
      error: null;
    }>
  | Readonly<{
      status: "failure";
      image: string;
      name: null;
      description: null;
      attributes: [];
      error: string;
    }>;

export type FameMetadataBatchResult = Readonly<{
  revision: FameArtworkRevision;
  metadata: FameMetadataResult;
}>;
