export type SubmittedTransactionStatus = "success" | "reverted" | "unknown";

export function createTransactionSingleFlight() {
  let active = false;

  return async (task: () => Promise<void>): Promise<boolean> => {
    if (active) return false;
    active = true;
    try {
      await task();
      return true;
    } finally {
      active = false;
    }
  };
}

export async function reconcileSubmittedTransaction(
  readReceiptStatus: () => Promise<"success" | "reverted">,
): Promise<SubmittedTransactionStatus> {
  try {
    return await readReceiptStatus();
  } catch {
    return "unknown";
  }
}
