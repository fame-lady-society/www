"use client";

import React, { useState } from "react";
import IrysUploaderWidget from "@/components/IrysUploaderWidget";
import { DefaultProvider } from "@/context/default";

export default function UploadPage() {
  const [lastTx, setLastTx] = useState<string | null>(null);

  return (
    <DefaultProvider mainnet base>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">
          Upload to Arweave (via Irys)
        </h1>

        <IrysUploaderWidget onComplete={(txid) => setLastTx(txid)} />

        {lastTx && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="font-medium">Upload complete</p>
            <a
              className="text-blue-600 break-all"
              href={`https://gateway.irys.xyz/${lastTx}`}
              target="_blank"
              rel="noreferrer"
            >
              {`https://gateway.irys.xyz/${lastTx}`}
            </a>
          </div>
        )}
      </div>
    </DefaultProvider>
  );
}
