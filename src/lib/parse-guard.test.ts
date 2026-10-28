import { describe, expect, it } from "vitest";
import {
  PARSE_LIMIT_PER_IP,
  authorizeParse,
  clientKey,
  createRateLimiter,
  resetParseGuardForTests,
  sameOriginError,
} from "./parse-guard";

function headers(values: Record<string, string>) {
  return {
    get(name: string) {
      return values[name.toLowerCase()] ?? null;
    },
  };
}

const allowed = headers({
  origin: "https://Example.com",
  host: "example.com",
  "x-forwarded-for": "203.0.113.8",
});

describe("sameOriginError", () => {
  it("rejects a missing or opaque origin", () => {
    expect(sameOriginError(headers({ host: "example.com" }))).toMatch(/missing/i);
    expect(
      sameOriginError(headers({ origin: "null", host: "example.com" })),
    ).toMatch(/missing/i);
  });

  it("rejects a mismatched origin", () => {
    expect(
      sameOriginError(
        headers({ origin: "https://evil.example", host: "example.com" }),
      ),
    ).toMatch(/not allowed/i);
  });

  it("accepts an origin that matches x-forwarded-host", () => {
    expect(
      sameOriginError(
        headers({
          origin: "https://demo.example",
          host: "internal.local",
          "x-forwarded-host": "demo.example",
        }),
      ),
    ).toBeNull();
  });
});

describe("clientKey", () => {
  it("uses the first forwarded address", () => {
    expect(
      clientKey(headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })),
    ).toBe("203.0.113.9");
  });
});

describe("authorizeParse", () => {
  it("allows a same-origin request and then rate limits that address", () => {
    resetParseGuardForTests();
    for (let attempt = 0; attempt < PARSE_LIMIT_PER_IP; attempt += 1) {
      expect(authorizeParse(allowed, 1_000 + attempt).ok).toBe(true);
    }
    const blocked = authorizeParse(allowed, 1_000 + PARSE_LIMIT_PER_IP);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.message).toMatch(/too many/i);
  });

  it("does not consume a rate-limit slot when the origin is rejected", () => {
    resetParseGuardForTests();
    const denied = headers({ origin: "https://evil.example", host: "example.com" });
    for (let attempt = 0; attempt < PARSE_LIMIT_PER_IP + 2; attempt += 1) {
      const result = authorizeParse(denied, 5_000);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toMatch(/not allowed/i);
    }
    expect(authorizeParse(allowed, 5_000).ok).toBe(true);
  });
});

describe("createRateLimiter", () => {
  it("enforces a global cap across addresses", () => {
    const limiter = createRateLimiter({ perIp: 10, global: 2, windowMs: 1_000 });
    expect(limiter.tryConsume("a", 10)).toBe(true);
    expect(limiter.tryConsume("b", 10)).toBe(true);
    expect(limiter.tryConsume("c", 10)).toBe(false);
  });
});
