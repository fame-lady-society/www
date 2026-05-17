export function isTokenIdArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => Number.isInteger(item));
}

export async function readOwnedTokenIds(response: Response): Promise<number[]> {
  if (!response.ok) {
    throw new Error(
      `Failed to fetch owned tokens. Received ${response.status}.`,
    );
  }

  const data: unknown = await response.json();
  if (!isTokenIdArray(data)) {
    throw new Error("Owned token response must be an array of token ids.");
  }

  return data;
}
