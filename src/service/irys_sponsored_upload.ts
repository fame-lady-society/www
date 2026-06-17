import { formatEther } from "viem";

export type IrysUploadTag = {
  name: string;
  value: string;
};

export type IrysSponsoredUploader = {
  getPrice: (bytes: number) => Promise<unknown>;
  getBalance: () => Promise<unknown>;
  fund: (amount: bigint) => Promise<unknown>;
  upload: (
    content: string | Uint8Array,
    opts: { tags: IrysUploadTag[] },
  ) => Promise<{ id?: string } | undefined>;
};

export function toBigIntAmount(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") return BigInt(value);
  const maybeString = value as { toString?: () => string } | null | undefined;
  return BigInt(maybeString?.toString?.() ?? 0);
}

export function computeBufferedIrysPrice(price: bigint) {
  return (price * 110n) / 100n;
}

export async function ensureIrysBalance(opts: {
  uploader: IrysSponsoredUploader;
  bytes: number;
  maxFundAmount: bigint;
  logContext?: Record<string, unknown>;
}) {
  const priceRaw = await opts.uploader.getPrice(opts.bytes);
  const price = toBigIntAmount(priceRaw);
  const bufferedPrice = computeBufferedIrysPrice(price);

  const balanceRaw = await opts.uploader.getBalance();
  let loadedBalance = toBigIntAmount(balanceRaw);
  if (loadedBalance >= bufferedPrice) {
    return { bufferedPrice, loadedBalance, funded: 0n };
  }

  const requiredAmount = bufferedPrice - loadedBalance;
  if (opts.maxFundAmount < requiredAmount) {
    throw new Error(
      `Insufficient sponsor balance to fund Irys upload. Need ${formatEther(requiredAmount)} ETH.`,
    );
  }

  const fundAmount = requiredAmount;
  await opts.uploader.fund(fundAmount);
  const refreshedBalance = toBigIntAmount(await opts.uploader.getBalance());
  loadedBalance =
    refreshedBalance > loadedBalance ? refreshedBalance : loadedBalance;

  if (loadedBalance < bufferedPrice) {
    throw new Error("Irys funding did not load enough balance for upload");
  }

  if (opts.logContext) {
    console.log(
      "[irys] sponsored funding complete",
      JSON.stringify({
        ...opts.logContext,
        loaded: formatEther(loadedBalance),
        funded: formatEther(fundAmount),
      }),
    );
  }

  return { bufferedPrice, loadedBalance, funded: fundAmount };
}

export async function uploadToIrys(opts: {
  uploader: IrysSponsoredUploader;
  content: string | Uint8Array;
  tags: IrysUploadTag[];
}) {
  const result = await opts.uploader.upload(opts.content, { tags: opts.tags });
  const txid = result?.id;
  if (!txid) {
    throw new Error("Upload failed: no transaction ID returned");
  }
  return `https://gateway.irys.xyz/${txid}`;
}
