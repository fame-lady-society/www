/**
 * Keep the selector responsive when the Base RPC is unavailable. The target
 * cards load their artwork through the image route after the document renders;
 * the selector itself only needs the ordered pool snapshot.
 */
export const ROTATOR_SELECTOR_READ_TIMEOUT_MS = 7_500;

export class RotatorSelectorReadTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Waiting-pool read exceeded ${timeoutMs}ms.`);
    this.name = "RotatorSelectorReadTimeoutError";
  }
}

/** Race a selector server read against a bounded deadline. */
export async function withRotatorSelectorReadDeadline<T>(
  read: Promise<T>,
  timeoutMs = ROTATOR_SELECTOR_READ_TIMEOUT_MS,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      read,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new RotatorSelectorReadTimeoutError(timeoutMs)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
