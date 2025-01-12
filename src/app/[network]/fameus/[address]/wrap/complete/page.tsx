import { isAddress } from "viem";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function Home({
  params,
}: {
  params: { address: string; network: string };
}) {
  if (!isAddress(params.address)) {
    throw new Error("Invalid address");
  }

  const chainId =
    params.network === "base"
      ? 8453
      : params.network === "sepolia"
        ? 11155111
        : null;

  if (!chainId) {
    throw new Error("Invalid chain");
  }

  revalidatePath(`/${params.network}/fameus/${params.address}/wrap`);
  redirect(`/${params.network}/fameus/${params.address}/wrap`);
}

export const revalidate = 0;
