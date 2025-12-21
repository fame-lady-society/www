import { Uploader } from "@irys/upload";
import { BaseEth } from "@irys/upload-ethereum";

/**
 * Build an Irys uploader using the Node-focused @irys/upload stack.
 * This signs locally with the provided private key and talks to the
 * configured Base RPC (write-capable).
 */
export async function buildNodeIrysUploader(opts: {
  privateKey: `0x${string}`;
}) {
  const uploader = await Uploader(BaseEth).withWallet(opts.privateKey);
  return uploader;
}
