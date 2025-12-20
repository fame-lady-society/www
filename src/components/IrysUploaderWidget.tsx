"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { getIrysUploader } from "@/service/irys_client";
import { formatEther } from "viem";

// extend window with ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}

export type IrysUploaderWidgetProps = {
  onComplete?: (txid: string) => void;
  /**
   * If provided, the widget will use this in-memory file as the single upload
   * target and hide the dropzone UI. content should be the file text.
   */
  initialFile?: { name: string; content: string } | null;
};

type UploadStatus =
  | "pending"
  | "queued"
  | "uploading"
  | "uploaded"
  | "done"
  | "error";

type UploadFile = {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  txid?: string | null;
  error?: string | null;
};

const StatusChip: React.FC<{ status?: string }> = ({ status }) => {
  const map: Record<string, string> = {
    idle: "bg-gray-200 text-gray-800",
    connecting: "bg-indigo-600 text-white",
    estimating: "bg-yellow-500 text-white",
    funding: "bg-yellow-600 text-white",
    uploading: "bg-green-600 text-white",
    uploaded: "bg-green-700 text-white",
    done: "bg-green-700 text-white",
    error: "bg-red-600 text-white",
    connected: "bg-indigo-500 text-white",
    estimated: "bg-yellow-400 text-black",
    funded: "bg-emerald-600 text-white",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
        map[status ?? "idle"] ?? map.idle
      }`}
    >
      {status ?? "idle"}
    </span>
  );
};

export const IrysUploaderWidget: React.FC<IrysUploaderWidgetProps> = ({
  onComplete,
  initialFile = null,
}) => {
  const [uploader, setUploader] = useState<any | null>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [priceEth, setPriceEth] = useState<string | null>(null);
  const [loadedBalanceEth, setLoadedBalanceEth] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const MAX_LOG_LINES = 150;
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
    // fallback: truncate long messages
    return truncateLine(msg, 300);
  };

  const appendLog = useCallback((s: string) => {
    setLog((l) => {
      const next = [...l, truncateLine(String(s))];
      return next.slice(-MAX_LOG_LINES);
    });
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      if (acceptedFiles.length > 1) {
        appendLog(
          "Multiple files selected — only the first file will be accepted for upload (single-file mode).",
        );
      }
      const f = acceptedFiles[0];
      const uploadFile: UploadFile = {
        id:
          (crypto?.randomUUID && crypto.randomUUID()) ||
          `${Date.now()}-${f.name}`,
        file: f,
        progress: 0,
        status: "pending",
        txid: null,
        error: null,
      };
      // Replace any existing files — single-file mode
      setFiles([uploadFile]);
    },
    [appendLog],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  // If an initialFile is provided, convert to a File and populate the files
  // list so the user can proceed with Connect/Estimate/Fund/Upload flows.
  useEffect(() => {
    if (!initialFile) return;
    try {
      const f = new File([initialFile.content], initialFile.name, {
        type: "application/json",
      });
      const uploadFile: UploadFile = {
        id:
          (crypto?.randomUUID && crypto.randomUUID()) ||
          `${Date.now()}-${f.name}`,
        file: f,
        progress: 0,
        status: "pending",
        txid: null,
        error: null,
      };
      setFiles([uploadFile]);
    } catch (err) {
      appendLog(`Failed to prepare initial file: ${String(err)}`);
    }
  }, [initialFile, appendLog]);

  const totalBytes = useMemo(
    () => files.reduce((acc, f) => acc + f.file.size, 0),
    [files],
  );

  const handleConnect = async (): Promise<any | null> => {
    if (typeof window === "undefined" || !window.ethereum)
      return appendLog("window.ethereum not found");
    try {
      setStatus("connecting");
      setProgress(10);
      const uc = await getIrysUploader();
      setUploader(uc);
      appendLog("Uploader ready");
      setStatus("connected");
      setProgress(20);
      return uc;
    } catch (err: any) {
      appendLog(`Error creating uploader: ${friendlyErr(err)}`);
      setStatus("error");
      setProgress(0);
      return null;
    }
  };

  const computeBufferedPrice = async (
    providedUploader?: any,
  ): Promise<{ buffered: bigint; raw: bigint }> => {
    const uc = providedUploader ?? uploader;
    if (!uc) throw new Error("No uploader");
    const priceRaw = await uc.getPrice(totalBytes);
    const priceBn = BigInt(priceRaw?.toString?.() ?? priceRaw ?? 0);
    const buffered = (priceBn * 110n) / 100n;
    return { buffered, raw: priceBn };
  };

  const handleEstimate = async () => {
    if (files.length === 0) return appendLog("No files selected");

    try {
      setStatus("estimating");
      setProgress(30);
      appendLog(
        `Estimating price for ${files.length} file(s), ${totalBytes} bytes`,
      );
      const uc = uploader ?? (await handleConnect());
      if (!uc) return appendLog("Unable to create uploader for estimate");
      const { buffered } = await computeBufferedPrice(uc);
      setPriceEth(formatEther(buffered));

      if (typeof uc.getLoadedBalance === "function") {
        const loaded = await uc.getLoadedBalance();
        const loadedBn = BigInt(loaded?.toString?.() ?? loaded ?? 0);
        setLoadedBalanceEth(formatEther(loadedBn));
        appendLog(
          `Price (buffered 10%): ${formatEther(buffered)} ETH — Loaded balance: ${formatEther(loadedBn)} ETH`,
        );
      } else {
        appendLog(`Price (buffered 10%): ${formatEther(buffered)} ETH`);
      }
      setProgress(40);
      setStatus("estimated");
    } catch (err: any) {
      appendLog(`Estimate error: ${friendlyErr(err)}`);
      setStatus("error");
    }
  };

  const handleFund = async () => {
    if (files.length === 0) return appendLog("No files selected");

    try {
      setStatus("funding");
      setProgress(45);
      const uc = uploader ?? (await handleConnect());
      if (!uc) return appendLog("Unable to create uploader for funding");
      const loaded = await uc.getLoadedBalance();
      const loadedBn = BigInt(loaded?.toString?.() ?? loaded ?? 0);
      const { buffered } = await computeBufferedPrice(uc);

      if (loadedBn >= buffered) {
        appendLog("Wallet already funded for this upload");
        setLoadedBalanceEth(formatEther(loadedBn));
        setProgress(60);
        setStatus("funded");
        return;
      }

      const need = buffered - loadedBn;
      appendLog(`Funding uploader with ${formatEther(need)} ETH...`);
      await uc.fund(need);
      const newLoaded = await uc.getLoadedBalance();
      setLoadedBalanceEth(
        formatEther(BigInt(newLoaded?.toString?.() ?? newLoaded ?? 0)),
      );
      appendLog("Funding complete");
      setProgress(60);
      setStatus("funded");
    } catch (err: any) {
      appendLog(`Fund error: ${friendlyErr(err)}`);
      setStatus("error");
    }
  };

  const handleUpload = async () => {
    // Chain connect -> estimate -> fund (if needed) -> upload
    try {
      const uc = uploader ?? (await handleConnect());
      if (!uc) return appendLog("Unable to create uploader");

      if (files.length === 0) return appendLog("No files to upload");

      setStatus("uploading");
      setProgress(10);

      // compute buffered price and ensure funding
      const { buffered } = await computeBufferedPrice(uc);
      const loaded = await uc.getLoadedBalance();
      const loadedBn = BigInt(loaded?.toString?.() ?? loaded ?? 0);

      if (loadedBn < buffered) {
        const need = buffered - loadedBn;
        appendLog(
          `Insufficient loaded balance — funding with ${formatEther(need)} ETH`,
        );
        try {
          await uc.fund(need);
          const newLoaded = await uc.getLoadedBalance();
          setLoadedBalanceEth(
            formatEther(BigInt(newLoaded?.toString?.() ?? newLoaded ?? 0)),
          );
          appendLog("Funding complete");
        } catch (err: any) {
          appendLog(`Funding failed: ${friendlyErr(err)}`);
          setStatus("error");
          return;
        }
      }

      // now upload sequentially
      for (const fileObj of files) {
        if (fileObj.status === "done" || fileObj.status === "uploading")
          continue;
        setFiles((prev) =>
          prev.map((p) =>
            p.id === fileObj.id
              ? { ...p, status: "uploading", progress: 20 }
              : p,
          ),
        );
        appendLog(
          `Uploading ${fileObj.file.name} (${fileObj.file.size} bytes)...`,
        );
        try {
          const res = await uc.uploadFile(fileObj.file);
          const txid = res?.id ?? res?.txid ?? res?.transactionId ?? null;
          setFiles((prev) =>
            prev.map((p) =>
              p.id === fileObj.id
                ? { ...p, status: "done", progress: 100, txid }
                : p,
            ),
          );
          appendLog(
            `Uploaded ${fileObj.file.name} tx id: ${txid ?? JSON.stringify(res)}`,
          );
          setProgress((p) => Math.min(100, p + 30));
          if (txid) onComplete?.(`https://gateway.irys.xyz/${txid}`);
        } catch (err: any) {
          const msg = friendlyErr(err);
          setFiles((prev) =>
            prev.map((p) =>
              p.id === fileObj.id ? { ...p, status: "error", error: msg } : p,
            ),
          );
          appendLog(`Upload failed for ${fileObj.file.name}: ${msg}`);
          setStatus("error");
        }
      }

      setProgress(100);
      setStatus("done");
      appendLog("All uploads processed");
    } catch (err: any) {
      appendLog(`Upload flow failed: ${friendlyErr(err)}`);
      setStatus("error");
    }
  };

  const uploadSingle = async (fileId: string) => {
    const fileObj = files.find((f) => f.id === fileId);
    if (!fileObj) return;
    if (!uploader) return appendLog("Connect uploader first");

    setFiles((prev) =>
      prev.map((p) =>
        p.id === fileId ? { ...p, status: "uploading", progress: 10 } : p,
      ),
    );
    appendLog(`Retrying upload for ${fileObj.file.name}...`);
    try {
      const res = await uploader.uploadFile(fileObj.file);
      const txid = res?.id ?? res?.txid ?? res?.transactionId ?? null;
      setFiles((prev) =>
        prev.map((p) =>
          p.id === fileId ? { ...p, status: "done", progress: 100, txid } : p,
        ),
      );
      appendLog(
        `Uploaded ${fileObj.file.name} tx id: ${txid ?? JSON.stringify(res)}`,
      );
      if (txid) onComplete?.(`https://gateway.irys.xyz/${txid}`);
    } catch (err: any) {
      const msg = friendlyErr(err);
      setFiles((prev) =>
        prev.map((p) =>
          p.id === fileId ? { ...p, status: "error", error: msg } : p,
        ),
      );
      appendLog(`Retry failed for ${fileObj.file.name}: ${msg}`);
    }
  };

  const clearFiles = () => setFiles([]);

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white/40 rounded">
      <div className="mb-4 flex gap-2">
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded"
          onClick={handleConnect}
        >
          Connect Wallet
        </button>
        <button
          className="px-3 py-1 bg-gray-700 text-white rounded"
          onClick={handleEstimate}
        >
          Estimate
        </button>
        <button
          className="px-3 py-1 bg-yellow-600 text-white rounded"
          onClick={handleFund}
        >
          Fund
        </button>
        <button
          className="px-3 py-1 bg-green-600 text-white rounded"
          onClick={handleUpload}
        >
          Upload
        </button>
      </div>

      <div
        {...getRootProps()}
        className="border-2 border-dashed p-6 rounded mb-4"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop files here...</p>
        ) : (
          <p>Drag n drop files here, or click to select</p>
        )}
      </div>

      <div className="mb-4">
        <h3 className="font-medium">Files</h3>
        {files.length === 0 ? (
          <p className="text-sm text-gray-500">No files selected</p>
        ) : (
          <div className="border rounded p-2 max-h-44 overflow-auto">
            <ul className="flex flex-col gap-2">
              {files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="truncate">
                    <div className="font-medium truncate">{f.file.name}</div>
                    <div className="text-xs text-gray-500">
                      {f.file.size} bytes
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-40">
                      <div className="bg-gray-200 h-2 rounded overflow-hidden">
                        <div
                          style={{ width: `${f.progress}%` }}
                          className={`h-2 ${f.status === "error" ? "bg-red-500" : "bg-green-600"}`}
                        />
                      </div>
                    </div>
                    <div className="text-xs">
                      <StatusChip status={f.status} />
                    </div>
                    {f.status === "error" && (
                      <button
                        className="text-sm text-blue-600"
                        onClick={() => uploadSingle(f.id)}
                      >
                        Retry
                      </button>
                    )}
                    {f.txid && (
                      <a
                        className="text-sm text-blue-600 break-words"
                        href={`https://gateway.irys.xyz/${f.txid}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {files.length > 0 && (
          <button className="text-sm text-red-600 mt-2" onClick={clearFiles}>
            Clear
          </button>
        )}
      </div>

      <div className="mb-4">
        <h3 className="font-medium">Progress</h3>
        <progress value={progress} max={100} className="w-full h-3" />
        <p className="text-sm text-gray-600 mt-1">
          {status ?? "idle"} — {progress}%
        </p>
      </div>

      <div className="mb-4">
        <h3 className="font-medium">Estimate</h3>
        <p>Total bytes: {totalBytes}</p>
        <p>Price: {priceEth ?? "-"} ETH</p>
        <p>Loaded balance: {loadedBalanceEth ?? "-"} ETH</p>
      </div>

      <div className="mb-4">
        <h3 className="font-medium">Logs</h3>
        <div className="bg-gray-100 p-3 rounded max-h-40 overflow-auto text-gray-800">
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

export default IrysUploaderWidget;
