import { describe, expect, it } from "vitest";
import {
  AUTH_OR_CREDIT_MESSAGE,
  QUOTA_MESSAGE,
  UNAVAILABLE_MESSAGE,
  classifyUpstreamFailure,
  demoBannerForFailure,
  friendlyParseMessage,
  toFriendlyParseError,
} from "./parse-errors";

const SECRET = "super-secret-key-value";

function upstream(status: number, body = `raw upstream ${SECRET}`) {
  const error = new Error(`API error occurred: ${body}`);
  error.name = "UnstructuredClientError";
  return Object.assign(error, { statusCode: status, body });
}

describe("classifyUpstreamFailure", () => {
  it("maps 401 to an auth or credit message and a demo fallback", () => {
    const failure = classifyUpstreamFailure(upstream(401));
    expect(failure.status).toBe(401);
    expect(failure.demoFallback).toBe(true);
    expect(failure.message).toBe(AUTH_OR_CREDIT_MESSAGE);
    expect(failure.message).not.toContain(SECRET);
    expect(demoBannerForFailure(failure)).toMatch(/^Demo mode: sample results\./);
  });

  it("maps 403 the same way as 401", () => {
    const failure = classifyUpstreamFailure(upstream(403, `forbidden ${SECRET}`));
    expect(failure.status).toBe(403);
    expect(failure.demoFallback).toBe(true);
    expect(failure.message).toBe(AUTH_OR_CREDIT_MESSAGE);
    expect(JSON.stringify(failure)).not.toContain(SECRET);
  });

  it("maps 402 to quota copy and a demo fallback", () => {
    const failure = classifyUpstreamFailure(upstream(402));
    expect(failure.status).toBe(402);
    expect(failure.demoFallback).toBe(true);
    expect(failure.message).toBe(QUOTA_MESSAGE);
    expect(failure.message).not.toContain(SECRET);
  });

  it("maps 429 to quota copy without a demo fallback", () => {
    const failure = classifyUpstreamFailure(upstream(429));
    expect(failure.status).toBe(429);
    expect(failure.demoFallback).toBe(false);
    expect(failure.message).toBe(QUOTA_MESSAGE);
    expect(failure.message).not.toContain(SECRET);
  });

  it("maps 5xx to unavailable without the upstream body", () => {
    for (const status of [500, 502, 503]) {
      const failure = classifyUpstreamFailure(upstream(status));
      expect(failure.status).toBe(503);
      expect(failure.demoFallback).toBe(false);
      expect(failure.message).toBe(UNAVAILABLE_MESSAGE);
      expect(failure.message).not.toContain(SECRET);
    }
  });

  it("maps a timeout to unavailable", () => {
    const error = new Error(`timed out calling host with ${SECRET}`);
    error.name = "RequestTimeoutError";
    const failure = classifyUpstreamFailure(error);
    expect(failure.status).toBe(504);
    expect(failure.demoFallback).toBe(false);
    expect(failure.message).toBe(UNAVAILABLE_MESSAGE);
    expect(failure.message).not.toContain(SECRET);
  });

  it("reads a status nested on the cause", () => {
    const error = new Error("wrapper");
    error.cause = upstream(401);
    expect(classifyUpstreamFailure(error).status).toBe(401);
    expect(classifyUpstreamFailure(error).message).not.toContain(SECRET);
  });
});

describe("friendlyParseMessage", () => {
  it("hides SplitPdfHook and other raw SDK text", () => {
    const err = new Error(
      `Unexpected HTTP client error: Error: Failed to send request for page 2. ${SECRET}`,
    );
    const msg = friendlyParseMessage(err);
    expect(msg).toBe(UNAVAILABLE_MESSAGE);
    expect(msg).not.toContain(SECRET);
    expect(msg).not.toMatch(/Unexpected HTTP/i);
  });

  it("does not echo a missing-config exception", () => {
    const msg = friendlyParseMessage(
      new Error("Missing Unstructured API configuration."),
    );
    expect(msg).toBe(UNAVAILABLE_MESSAGE);
    expect(msg).not.toContain("UNSTRUCTURED_API_KEY");
  });

  it("maps connection failures without the raw message", () => {
    const err = new Error(`Unable to make request ${SECRET}`);
    err.name = "ConnectionError";
    expect(friendlyParseMessage(err)).toBe(UNAVAILABLE_MESSAGE);
  });

  it("hides production server-action redaction", () => {
    const msg = friendlyParseMessage(
      new Error(
        "Minified React error #441; visit https://react.dev/errors/441 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.",
      ),
    );
    expect(msg).toBe(UNAVAILABLE_MESSAGE);
    expect(msg).not.toMatch(/minified react error/i);
  });

  it("preserves our own validation messages", () => {
    expect(
      friendlyParseMessage(
        new Error("Unsupported file type. Please upload a PDF or image file."),
      ),
    ).toBe("Unsupported file type. Please upload a PDF or image file.");
  });
});

describe("toFriendlyParseError", () => {
  it("returns ParseError with a fixed message and status", () => {
    const err = toFriendlyParseError(upstream(500));
    expect(err.name).toBe("ParseError");
    expect(err.message).toBe(UNAVAILABLE_MESSAGE);
    expect((err as Error & { statusCode?: number }).statusCode).toBe(503);
    expect(err.message).not.toContain(SECRET);
  });
});
