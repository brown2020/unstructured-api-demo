/**
 * Map Unstructured failures to fixed UI copy.
 * Status comes from the error object. Upstream bodies and messages are never returned.
 */

export const AUTH_OR_CREDIT_MESSAGE =
  "The parsing service key is invalid or the account is out of credits. Contact the site owner.";

export const QUOTA_MESSAGE =
  "The parsing quota or rate limit was reached. Try again later.";

export const UNAVAILABLE_MESSAGE = "The parsing service is unavailable.";

export const DEMO_BANNER = "Demo mode: sample results";

export const DEMO_UNCONFIGURED_BANNER = `${DEMO_BANNER}. The parsing service is not configured.`;

const SAFE_MESSAGES = new Set([
  "No file uploaded",
  "Unsupported file type. Please upload a PDF or image file.",
  "File is too large. Please keep uploads under 4MB.",
  "The file content does not match a PDF or image.",
  "No readable content found.",
  "Upload blocked because the request origin is missing.",
  "Upload blocked because the request origin is not allowed.",
  "Too many parse requests. Wait a few minutes and try again.",
  AUTH_OR_CREDIT_MESSAGE,
  QUOTA_MESSAGE,
  UNAVAILABLE_MESSAGE,
  DEMO_BANNER,
  DEMO_UNCONFIGURED_BANNER,
]);

export type UpstreamFailure = {
  status: number;
  message: string;
  demoFallback: boolean;
};

function walkErrors(error: unknown, visit: (value: object) => boolean): void {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if (visit(current)) return;
    current = (current as { cause?: unknown }).cause;
  }
}

function readStatus(error: unknown): number | null {
  let status: number | null = null;
  walkErrors(error, (value) => {
    const obj = value as { statusCode?: unknown; status?: unknown };
    if (typeof obj.statusCode === "number" && obj.statusCode >= 100 && obj.statusCode <= 599) {
      status = obj.statusCode;
      return true;
    }
    if (typeof obj.status === "number" && obj.status >= 100 && obj.status <= 599) {
      status = obj.status;
      return true;
    }
    return false;
  });
  return status;
}

function isTimeout(error: unknown): boolean {
  let timedOut = false;
  walkErrors(error, (value) => {
    const name = (value as { name?: unknown }).name;
    if (
      name === "RequestTimeoutError" ||
      name === "TimeoutError" ||
      name === "AbortError"
    ) {
      timedOut = true;
      return true;
    }
    return false;
  });
  return timedOut;
}

export function classifyUpstreamFailure(error: unknown): UpstreamFailure {
  if (isTimeout(error)) {
    return { status: 504, message: UNAVAILABLE_MESSAGE, demoFallback: false };
  }

  const status = readStatus(error);
  if (status === 401 || status === 403) {
    return { status, message: AUTH_OR_CREDIT_MESSAGE, demoFallback: true };
  }
  if (status === 402) {
    return { status: 402, message: QUOTA_MESSAGE, demoFallback: true };
  }
  if (status === 429) {
    return { status: 429, message: QUOTA_MESSAGE, demoFallback: false };
  }
  if (status != null && status >= 500) {
    return { status: 503, message: UNAVAILABLE_MESSAGE, demoFallback: false };
  }

  return { status: 503, message: UNAVAILABLE_MESSAGE, demoFallback: false };
}

export function demoBannerForFailure(failure: UpstreamFailure): string {
  return `${DEMO_BANNER}. ${failure.message}`;
}

/** Convert any thrown parse failure into a friendly, non-technical message. */
export function friendlyParseMessage(error: unknown): string {
  if (error instanceof Error && SAFE_MESSAGES.has(error.message)) {
    return error.message;
  }
  return classifyUpstreamFailure(error).message;
}

export function toFriendlyParseError(error: unknown): Error {
  const failure = classifyUpstreamFailure(error);
  const err = new Error(
    error instanceof Error && SAFE_MESSAGES.has(error.message)
      ? error.message
      : failure.message,
  );
  err.name = "ParseError";
  (err as Error & { statusCode?: number }).statusCode = failure.status;
  return err;
}
