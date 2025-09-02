"use client";

import React, { useCallback, useMemo, useState } from "react";
import IrysUploaderWidget from "@/components/IrysUploaderWidget";
import { getIrysUploader } from "@/service/irys_client";
import { formatEther } from "viem";

export type MetadataIrysUploaderProps = {
  template: (url: string) => string | Promise<string>;
  filename?: string;
  onComplete?: (uri: string) => void;
  label?: string;
};

const truncateLine = (s: string, max = 1000) =>
  s.length > max ? s.slice(0, max) + "…" : s;

const friendlyErr = (err: any) => {
  const msg = String(err?.message ?? err ?? "Unknown error");
  if (/user rejected the request/i.test(msg))
    return "Transaction rejected by wallet.";
  if (/insufficient funds|not enough balance|402 error/i.test(msg))
    return "Not enough balance for transaction.";
  if (/transactionexecutionerror/i.test(msg))
    return "Transaction execution failed.";
  return truncateLine(msg, 300);
};

export const MetadataIrysUploader: React.FC<MetadataIrysUploaderProps> = ({
  template,
  filename = "metadata.json",
  onComplete,
  label = "Metadata Upload",
}) => {
  const [step, setStep] = useState<"image" | "metadata" | "done">("image");
  const [imageTx, setImageTx] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [metadataJson, setMetadataJson] = useState<string | null>(null);
  const [metaFile, setMetaFile] = useState<File | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const appendLog = useCallback((s: string) => {
    setLog((l) => [...l, truncateLine(String(s))].slice(-150));
  }, []);

  const onImageComplete = useCallback(
    async (txid: string) => {
      appendLog(`Image uploaded: ${txid}`);
      const url = `https://gateway.irys.xyz/${txid}`;
      setImageTx(txid);
      setImageUrl(url);
      setStep("metadata");

      try {
        const res = await template(url);
        const json = typeof res === "string" ? res : JSON.stringify(res);
        setMetadataJson(json);
        const f = new File([json], filename, { type: "application/json" });
        setMetaFile(f);
        appendLog("Metadata JSON generated and file prepared");
      } catch (err: any) {
        appendLog(`Template error: ${friendlyErr(err)}`);
      }
    },
    [appendLog, template, filename],
  );

  const computeBufferedPrice = useCallback(async (uc: any, bytes: number) => {
    const p = await uc.getPrice(bytes);
    const priceBn = BigInt(p?.toString?.() ?? p ?? 0);
    const buffered = (priceBn * 110n) / 100n;
    return { buffered, raw: priceBn };
  }, []);

  const handleUploadMetadata = useCallback(async () => {
    if (!metaFile) return appendLog("No metadata file prepared");
    if (!window || !window.ethereum)
      return appendLog("window.ethereum not found");

    setStatus("connecting");
    setProgress(5);
    try {
      const uc = await getIrysUploader();
      appendLog("Uploader ready for metadata upload");
      setStatus("estimating");
      setProgress(20);

      const { buffered } = await computeBufferedPrice(uc, metaFile.size);
      setProgress(35);
      const loaded = await uc.getLoadedBalance();
      const loadedBn = BigInt(loaded?.toString?.() ?? loaded ?? 0);
      appendLog(`Price (buffered 10%): ${formatEther(buffered)} ETH`);
      appendLog(`Loaded balance: ${formatEther(loadedBn)} ETH`);

      if (loadedBn < buffered) {
        const need = buffered - loadedBn;
        appendLog(`Funding uploader with ${formatEther(need)} ETH`);
        setStatus("funding");
        setProgress(45);
        await uc.fund(need);
        appendLog("Funding complete");
      }

      setStatus("uploading");
      setProgress(60);
      appendLog(`Uploading metadata file ${metaFile.name}...`);
      const res = await uc.uploadFile(metaFile);
      const r: any = res;
      const txid = r?.id ?? r?.txid ?? r?.transactionId ?? null;
      appendLog(`Metadata uploaded: ${txid}`);
      setProgress(100);
      setStatus("done");
      setStep("done");
      if (txid) onComplete?.(`https://gateway.irys.xyz/${txid}`);
    } catch (err: any) {
      appendLog(`Metadata upload failed: ${friendlyErr(err)}`);
      setStatus("error");
      setProgress(0);
    }
  }, [metaFile, appendLog, computeBufferedPrice, onComplete]);

  return (
    <div className="p-3 border rounded bg-white/50">
      <h4 className="font-semibold mb-2">{label}</h4>

      {step === "image" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Step 1: upload the image for the metadata (this will produce an
            image URL).
          </p>
          <IrysUploaderWidget onComplete={onImageComplete} />
        </div>
      )}

      {step === "metadata" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Step 2: review generated metadata and upload it.
          </p>
          <div className="bg-gray-50 border p-2 rounded text-gray-800">
            <div className="text-xs text-gray-500 mb-1">Image URL</div>
            <div className="break-words text-sm mb-2 text-gray-800">
              {imageUrl}
            </div>
            <div className="text-xs text-gray-500 mb-1">Generated JSON</div>
            <textarea
              readOnly
              className="w-full h-40 p-2 text-sm font-mono bg-white border rounded text-gray-800"
              value={metadataJson ?? ""}
            />
            <div className="flex gap-2 mt-2">
              <button
                className="px-3 py-1 bg-green-600 text-white rounded"
                onClick={handleUploadMetadata}
              >
                Upload Metadata
              </button>
              <button
                className="px-3 py-1 bg-gray-200 rounded"
                onClick={() => {
                  setStep("image");
                  setMetaFile(null);
                }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-2">
          <p className="text-sm">Metadata upload complete.</p>
          <div className="text-sm break-words">{imageUrl}</div>
        </div>
      )}

      <div className="mt-3">
        <div className="text-sm">
          Status: {status ?? "idle"} — {progress}%
        </div>
        <div className="bg-gray-100 p-2 rounded max-h-36 overflow-auto text-gray-800 mt-2">
          {log.length === 0 ? (
            <p className="text-sm text-gray-500">No logs yet</p>
          ) : null}
          <ol className="text-sm">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MetadataIrysUploader;
