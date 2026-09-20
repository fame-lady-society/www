import Holdings from "./Holdings";

export const metadata = { title: "NFT holdings export | FLS" };

export default async function Page({
  params,
}: {
  params: Promise<{ walletAddress: string }>;
}) {
  const { walletAddress } = await params;
  if (!/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
    return (
      <main className="p-10">
        <h1 className="text-2xl">Invalid wallet address</h1>
        <p>Use a 0x address with 40 hexadecimal characters.</p>
      </main>
    );
  }
  return <Holdings key={walletAddress} walletAddress={walletAddress} />;
}
