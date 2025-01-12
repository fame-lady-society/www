"use server";

import { revalidatePath } from "next/cache";

export async function revalidate(network: "sepolia" | "base", address: string) {
  revalidatePath(`/${network}/fameus/${address}/wrap`);
  revalidatePath(`/${network}/fameus/${address}/governance`);
}
