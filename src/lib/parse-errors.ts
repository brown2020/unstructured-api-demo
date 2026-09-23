/**
 * Map opaque Unstructured SDK / network failures into short UI-safe messages.
 * Avoids Speakeasy "Unexpected HTTP client error" / SplitPdfHook noise in the UI.
 */

const FALLBACK =
  "We couldn't parse this document. Check your Unstructured API key/URL and try again.";

function collectErrorText(error: unknown): string {
  const parts: string[] = [];
  const visit = (value: unknown, depth: number) => {
    if (depth > 4 || value == null) return;
    if (typeof value === "string") {
      parts.push(value);
      return;
    }
    if (value instanceof Error) {
      parts.push(value.message);
      parts.push(value.name);
      visit((value as Error & { cause?: unknown }).cause, depth + 1);
      return;
    }
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      for (const key of ["message", "body", "details", "statusText", "error"]) {
        if (typeof obj[key] === "string") parts.push(obj[key] as string);
      }
    }
  };
  visit(error, 0);
  return parts.join(" | ");
}

/** Convert any thrown parse failure into a friendly, non-technical message. */
export function friendlyParseMessage(error: unknown): string {
  const text = collectErrorText(error);
  const lower = text.toLowerCase();

  if (
    lower.includes("missing unstructured api") ||
    (lower.includes("configuration") && lower.includes("missing") && lower.includes("api"))
  ) {
    return "Unstructured API is not configured. Set UNSTRUCTURED_API_KEY and UNSTRUCTURED_API_URL in your environment, then restart the app.";
  }

  // SplitPdfHook: "Failed to send request for page N" wrapped as UnexpectedClientError
  if (
    lower.includes("failed to send request for page") ||
    lower.includes("unexpected http client error") ||
    lower.includes("unexpectedclienterror") ||
    lower.includes("number of retries exceeded for page")
  ) {
    return "Could not finish parsing every page of this PDF (a page request to Unstructured failed). Check your API key/URL and network, or try again with a smaller file.";
  }

  if (
    lower.includes("unable to make request") ||
    lower.includes("connectionerror") ||
    lower.includes("fetch failed") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound") ||
    lower.includes("networkerror")
  ) {
    return "Could not reach the Unstructured API. Check UNSTRUCTURED_API_URL and your network connection.";
  }

  if (
    lower.includes("request timed out") ||
    lower.includes("timeout") ||
    lower.includes("request aborted")
  ) {
    return "The Unstructured API request timed out. Try a smaller file or the Auto strategy.";
  }

  if (
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("unauthorized") ||
    lower.includes("forbidden") ||
    lower.includes("invalid api key")
  ) {
    return "Unstructured rejected the request (auth). Verify UNSTRUCTURED_API_KEY is valid.";
  }

  if (lower.includes("413") || lower.includes("too large") || lower.includes("payload")) {
    return "The document is too large for the Unstructured API. Try a smaller file (under 10MB).";
  }

  if (lower.includes("no elements found") || lower.includes("no readable content")) {
    return "No readable content was found in this file.";
  }

  if (
    error instanceof Error &&
    error.message &&
    error.message.length < 180 &&
    !error.message.includes("Unexpected HTTP") &&
    !/at\s+\S+\s+\(/.test(error.message)
  ) {
    return error.message;
  }

  return FALLBACK;
}

export function toFriendlyParseError(error: unknown): Error {
  const err = new Error(friendlyParseMessage(error));
  err.name = "ParseError";
  if (error && typeof error === "object") {
    const obj = error as Record<string, unknown>;
    if (typeof obj.statusCode === "number") {
      (err as Error & { statusCode?: number }).statusCode = obj.statusCode;
    } else if (typeof obj.status === "number") {
      (err as Error & { statusCode?: number }).statusCode = obj.status;
    }
  }
  return err;
}
