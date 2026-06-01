const SENSITIVE_DIAGNOSTIC_LINE =
  /\b(request body|response body|raw response|response headers|set-cookie|calldata|approval|swap request|private key|signer|authorization|api[-_ ]?key)\b|(?:^|[\s"'{}:,])(?:secret|token|access[_-]?token|refresh[_-]?token|authorization)(?:[-_ ]?(?:key|token))?["']?\s*[:=]/i;

export function redactSensitiveDiagnosticText(value: string): string {
  return value
    .replace(/(?:https?|wss?):\/\/\S+/g, "[redacted-url]")
    .replace(/\b(?:bearer|token)\s+[a-z0-9._~+/=-]+/gi, "[redacted-secret]")
    .replace(/0x[a-fA-F0-9]{64,}/g, "[redacted-hex]");
}

export function displaySafeDiagnosticMessage(
  value: unknown,
  fallback = "FAME quote request failed.",
): string {
  const raw = value instanceof Error ? value.message : String(value);
  return redactSensitiveDiagnosticText(
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(
        (line) => line.length > 0 && !SENSITIVE_DIAGNOSTIC_LINE.test(line),
      ) ?? fallback,
  );
}

export function displaySafeErrorMessage(error: unknown): string {
  return displaySafeDiagnosticMessage(error);
}
