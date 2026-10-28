/**
 * Parse action denial + fixture proofs.
 * Uses UNSTRUCTURED_USE_FIXTURES — never calls live Unstructured (no paid credits).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import { headers } from "next/headers";
import { PARSE_LIMIT_PER_IP, resetParseGuardForTests } from "@/lib/parse-guard";
import { parseFile } from "./parse";

function setNodeEnv(value: string | undefined) {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

function allowedHeaders(address = "198.51.100.20") {
  return {
    get(name: string) {
      const values: Record<string, string> = {
        origin: "https://example.com",
        host: "example.com",
        "x-forwarded-for": address,
      };
      return values[name.toLowerCase()] ?? null;
    },
  };
}

describe("parseFile denial and fixtures", () => {
  const prevFixture = process.env.UNSTRUCTURED_USE_FIXTURES;
  const prevKey = process.env.UNSTRUCTURED_API_KEY;
  const prevUrl = process.env.UNSTRUCTURED_API_URL;
  const prevNodeEnv = process.env.NODE_ENV;
  const prevHiRes = process.env.UNSTRUCTURED_HI_RES;

  beforeEach(() => {
    resetParseGuardForTests();
    vi.mocked(headers).mockResolvedValue(allowedHeaders() as never);
    process.env.UNSTRUCTURED_USE_FIXTURES = "true";
    delete process.env.UNSTRUCTURED_API_KEY;
    delete process.env.UNSTRUCTURED_API_URL;
    delete process.env.UNSTRUCTURED_HI_RES;
    setNodeEnv(prevNodeEnv);
  });

  afterEach(() => {
    if (prevFixture === undefined) delete process.env.UNSTRUCTURED_USE_FIXTURES;
    else process.env.UNSTRUCTURED_USE_FIXTURES = prevFixture;
    if (prevKey === undefined) delete process.env.UNSTRUCTURED_API_KEY;
    else process.env.UNSTRUCTURED_API_KEY = prevKey;
    if (prevUrl === undefined) delete process.env.UNSTRUCTURED_API_URL;
    else process.env.UNSTRUCTURED_API_URL = prevUrl;
    if (prevHiRes === undefined) delete process.env.UNSTRUCTURED_HI_RES;
    else process.env.UNSTRUCTURED_HI_RES = prevHiRes;
    setNodeEnv(prevNodeEnv);
  });

  it("denies a missing origin before reading the file", async () => {
    vi.mocked(headers).mockResolvedValue({
      get(name: string) {
        return name.toLowerCase() === "host" ? "example.com" : null;
      },
    } as never);
    const result = await parseFile(new FormData());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/origin/i);
  });

  it("denies missing file even with fixtures enabled", async () => {
    const result = await parseFile(new FormData());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/no file/i);
  });

  it("denies invalid type even with fixtures enabled", async () => {
    const fd = new FormData();
    fd.append("file", new File(["x"], "x.txt", { type: "text/plain" }));
    const result = await parseFile(fd);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/unsupported|pdf|image/i);
  });

  it("rate limits repeated calls from the same address", async () => {
    for (let attempt = 0; attempt < PARSE_LIMIT_PER_IP; attempt += 1) {
      const result = await parseFile(new FormData());
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toMatch(/no file/i);
    }
    const blocked = await parseFile(new FormData());
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.message).toMatch(/too many/i);
  });

  it("returns labeled fixture chunks without API keys", async () => {
    const fd = new FormData();
    fd.append(
      "file",
      new File(["%PDF"], "demo.pdf", { type: "application/pdf" }),
    );
    const result = await parseFile(fd);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.chunks[0].heading).toMatch(/\[fixture\]/i);
    expect(
      result.chunks.some((chunk) =>
        chunk.content.some((el) =>
          (el.text || "").toLowerCase().includes("[fixture]"),
        ),
      ),
    ).toBe(true);
  });

  it("does not use fixtures when NODE_ENV is production", async () => {
    setNodeEnv("production");
    process.env.UNSTRUCTURED_USE_FIXTURES = "true";
    const fd = new FormData();
    fd.append(
      "file",
      new File(["%PDF"], "demo.pdf", { type: "application/pdf" }),
    );
    const result = await parseFile(fd);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/UNSTRUCTURED_API_KEY/i);
  });
});
