import { type NextRequest } from "next/server";

type OwnersResponse = {
  owners: Record<string, number[]>;
};

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => Number.isInteger(item));
}

function isOwnersResponse(value: unknown): value is OwnersResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const owners = Reflect.get(value, "owners");
  if (typeof owners !== "object" || owners === null || Array.isArray(owners)) {
    return false;
  }

  return Object.values(owners).every(isNumberArray);
}

export async function fetchOwnedTokenIds(
  request: NextRequest,
  network: "base-sepolia" | "ethereum" | "sepolia",
  address: `0x${string}`,
): Promise<number[]> {
  const response = await fetch(
    new URL(`/api/owners/${network}`, request.nextUrl.origin),
    { next: { revalidate: 300 } },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${network} owners. Received ${response.status}.`,
    );
  }

  const data: unknown = await response.json();
  if (!isOwnersResponse(data)) {
    throw new Error(`${network} owners response must include token ids.`);
  }

  return data.owners[address.toLowerCase()] ?? [];
}
