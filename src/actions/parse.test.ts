/**
 * Parse action denial + fixture proofs.
 * Uses UNSTRUCTURED_USE_FIXTURES — never calls live Unstructured (no paid credits).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseFile } from "./parse";

describe("parseFile denial and fixtures", () => {
  const prevFixture = process.env.UNSTRUCTURED_USE_FIXTURES;
  const prevKey = process.env.UNSTRUCTURED_API_KEY;
  const prevUrl = process.env.UNSTRUCTURED_API_URL;

  beforeEach(() => {
    process.env.UNSTRUCTURED_USE_FIXTURES = "true";
    delete process.env.UNSTRUCTURED_API_KEY;
    delete process.env.UNSTRUCTURED_API_URL;
  });

  afterEach(() => {
    if (prevFixture === undefined) delete process.env.UNSTRUCTURED_USE_FIXTURES;
    else process.env.UNSTRUCTURED_USE_FIXTURES = prevFixture;
    if (prevKey === undefined) delete process.env.UNSTRUCTURED_API_KEY;
    else process.env.UNSTRUCTURED_API_KEY = prevKey;
    if (prevUrl === undefined) delete process.env.UNSTRUCTURED_API_URL;
    else process.env.UNSTRUCTURED_API_URL = prevUrl;
  });

  it("denies missing file even with fixtures enabled", async () => {
    await expect(parseFile(new FormData())).rejects.toThrow(/no file/i);
  });

  it("denies invalid type even with fixtures enabled", async () => {
    const fd = new FormData();
    fd.append("file", new File(["x"], "x.txt", { type: "text/plain" }));
    await expect(parseFile(fd)).rejects.toThrow(/unsupported|pdf|image/i);
  });

  it("returns labeled fixture chunks without API keys", async () => {
    const fd = new FormData();
    fd.append(
      "file",
      new File(["%PDF"], "demo.pdf", { type: "application/pdf" })
    );
    const chunks = await parseFile(fd);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].heading).toMatch(/\[fixture\]/i);
    expect(
      chunks.some((c) =>
        c.content.some((el) => (el.text || "").toLowerCase().includes("[fixture]"))
      )
    ).toBe(true);
  });
});
