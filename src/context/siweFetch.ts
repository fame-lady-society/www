export const SIWE_REQUEST_TIMEOUT_MS = 15_000;

export async function fetchSiwe(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = SIWE_REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("The SIWE request timed out. Please try again.", {
        cause: error,
      });
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
