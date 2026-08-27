"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { GalleryPurchaseState } from "../transactions/purchaseQueue";

export function galleryPurchaseReceiptHref(state: GalleryPurchaseState) {
  return state.status === "verified" && state.purchaseHash
    ? `/fame/market/purchase/${state.purchaseHash}`
    : null;
}

export function useGalleryPurchaseReceiptRedirect(state: GalleryPurchaseState) {
  const router = useRouter();
  const openedReceipt = useRef<string | null>(null);
  const receiptHref = galleryPurchaseReceiptHref(state);

  useEffect(() => {
    if (receiptHref === null || openedReceipt.current === receiptHref) return;
    openedReceipt.current = receiptHref;
    router.push(receiptHref);
  }, [receiptHref, router]);
}
