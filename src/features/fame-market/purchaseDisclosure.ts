export const GALLERY_PURCHASE_DISCLOSURE_STORAGE_KEY =
  "fame-marketplace-purchase-disclosure-v1";

const ACCEPTED_DISCLOSURE_VALUE = "accepted";

type DisclosureStorage = Pick<Storage, "getItem" | "setItem">;

type DisclosureStorageSource = () => DisclosureStorage;

type PendingDisclosure = { current: boolean };

type DisclosureStorageError = (
  operation: "read" | "write",
  cause: unknown,
) => void;

export function isGalleryPurchaseDisclosureAccepted(
  storage: DisclosureStorage,
) {
  return (
    storage.getItem(GALLERY_PURCHASE_DISCLOSURE_STORAGE_KEY) ===
    ACCEPTED_DISCLOSURE_VALUE
  );
}

export function acceptGalleryPurchaseDisclosure(storage: DisclosureStorage) {
  storage.setItem(
    GALLERY_PURCHASE_DISCLOSURE_STORAGE_KEY,
    ACCEPTED_DISCLOSURE_VALUE,
  );
}

export function requestGalleryPurchaseDisclosure({
  getStorage,
  pending,
  setOpen,
  beginAttempt,
  onStorageError,
}: {
  getStorage: DisclosureStorageSource;
  pending: PendingDisclosure;
  setOpen: (open: boolean) => void;
  beginAttempt: () => void;
  onStorageError: DisclosureStorageError;
}) {
  let accepted = false;
  try {
    accepted = isGalleryPurchaseDisclosureAccepted(getStorage());
  } catch (cause) {
    onStorageError("read", cause);
  }

  if (accepted) {
    beginAttempt();
    return;
  }
  pending.current = true;
  setOpen(true);
}

export function cancelGalleryPurchaseDisclosure({
  pending,
  setOpen,
  abortAttempt,
}: {
  pending: PendingDisclosure;
  setOpen: (open: boolean) => void;
  abortAttempt: () => void;
}) {
  if (!pending.current) return;
  pending.current = false;
  setOpen(false);
  abortAttempt();
}

export function understandGalleryPurchaseDisclosure({
  getStorage,
  pending,
  setOpen,
  beginAttempt,
  onStorageError,
  doNotShowAgain,
}: {
  getStorage: DisclosureStorageSource;
  pending: PendingDisclosure;
  setOpen: (open: boolean) => void;
  beginAttempt: () => void;
  onStorageError: DisclosureStorageError;
  doNotShowAgain: boolean;
}) {
  if (!pending.current) return;
  pending.current = false;
  setOpen(false);
  if (doNotShowAgain) {
    try {
      acceptGalleryPurchaseDisclosure(getStorage());
    } catch (cause) {
      onStorageError("write", cause);
    }
  }
  beginAttempt();
}
