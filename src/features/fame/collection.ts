/** The neutral Base Society collection domain. */
export const FAME_COLLECTION_FIRST_TOKEN_ID = 1;
export const FAME_COLLECTION_LAST_TOKEN_ID = 888;
export const FAME_COLLECTION_TOKEN_COUNT =
  FAME_COLLECTION_LAST_TOKEN_ID - FAME_COLLECTION_FIRST_TOKEN_ID + 1;

export function isFameCollectionTokenId(tokenId: number): boolean {
  return (
    Number.isInteger(tokenId) &&
    tokenId >= FAME_COLLECTION_FIRST_TOKEN_ID &&
    tokenId <= FAME_COLLECTION_LAST_TOKEN_ID
  );
}

export function fameCollectionTokenIds(): number[] {
  return Array.from(
    { length: FAME_COLLECTION_TOKEN_COUNT },
    (_, index) => FAME_COLLECTION_FIRST_TOKEN_ID + index,
  );
}

export function visibleFameCollectionTokenIds(
  artPoolStartIndex: number,
  artPoolEndIndex: number,
): number[] {
  if (
    !isFameCollectionTokenId(artPoolStartIndex) ||
    !isFameCollectionTokenId(artPoolEndIndex) ||
    artPoolStartIndex > artPoolEndIndex
  ) {
    throw new Error("Invalid Art Pool bounds for the FAME collection.");
  }

  return fameCollectionTokenIds().filter(
    (tokenId) => tokenId < artPoolStartIndex || tokenId > artPoolEndIndex,
  );
}
