import { describe, expect, it } from "vitest";
import {
  BAD_KEY_MESSAGE,
  OUT_OF_CREDITS_MESSAGE,
  RATE_LIMIT_MESSAGE,
  UNAVAILABLE_MESSAGE,
  UNSUPPORTED_TYPE_MESSAGE,
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
  it("maps 401 and 403 to a bad-key message without a demo fallback", () => {
    for (const status of [401, 403]) {
      const failure = classifyUpstreamFailure(upstream(status));
      expect(failure.status).toBe(status);
      expect(failure.demoFallback).toBe(false);
      expect(failure.message).toBe(BAD_KEY_MESSAGE);
      expect(JSON.stringify(failure)).not.toContain(SECRET);
    }
  });

  it("maps 402 to out of credits and a demo fallback", () => {
    const failure = classifyUpstreamFailure(upstream(402));
    expect(failure.status).toBe(402);
    expect(failure.demoFallback).toBe(true);
    expect(failure.message).toBe(OUT_OF_CREDITS_MESSAGE);
    expect(demoBannerForFailure(failure)).toBe(`Demo data. ${OUT_OF_CREDITS_MESSAGE}`);
    expect(failure.message).not.toContain(SECRET);
  });

  it("maps 415 to the unsupported-file message", () => {
    const failure = classifyUpstreamFailure(upstream(415));
    expect(failure.status).toBe(415);
    expect(failure.demoFallback).toBe(false);
    expect(failure.message).toBe(UNSUPPORTED_TYPE_MESSAGE);
    expect(failure.message).not.toContain(SECRET);
  });

  it("maps 429 to a rate-limit message without a demo fallback", () => {
    const failure = classifyUpstreamFailure(upstream(429));
    expect(failure.status).toBe(429);
    expect(failure.demoFallback).toBe(false);
    expect(failure.message).toBe(RATE_LIMIT_MESSAGE);
  });

  it("maps 5xx and timeouts to unavailable without the upstream body", () => {
    for (const status of [500, 502, 503]) {
      const failure = classifyUpstreamFailure(upstream(status));
      expect(failure.status).toBe(503);
      expect(failure.message).toBe(UNAVAILABLE_MESSAGE);
      expect(failure.message).not.toContain(SECRET);
    }
    const timeout = new Error(`timed out calling host with ${SECRET}`);
    timeout.name = "RequestTimeoutError";
    const failure = classifyUpstreamFailure(timeout);
    expect(failure.status).toBe(504);
    expect(failure.message).toBe(UNAVAILABLE_MESSAGE);
    expect(failure.message).not.toContain(SECRET);
  });
});

describe("friendlyParseMessage", () => {
  it("hides raw SDK text", () => {
    const err = new Error(`Unexpected HTTP client error: ${SECRET}`);
    expect(friendlyParseMessage(err)).toBe(UNAVAILABLE_MESSAGE);
  });

  it("preserves our own validation messages", () => {
    expect(friendlyParseMessage(new Error(UNSUPPORTED_TYPE_MESSAGE))).toBe(
      UNSUPPORTED_TYPE_MESSAGE,
    );
  });
});

describe("toFriendlyParseError", () => {
  it("returns a fixed message and status", () => {
    const err = toFriendlyParseError(upstream(500));
    expect(err.name).toBe("ParseError");
    expect(err.message).toBe(UNAVAILABLE_MESSAGE);
    expect((err as Error & { statusCode?: number }).statusCode).toBe(503);
    expect(err.message).not.toContain(SECRET);
  });
});
