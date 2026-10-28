import { describe, expect, it } from "vitest";
import {
  UNSTRUCTURED_RETRY,
  UNSTRUCTURED_TIMEOUT_MS,
  buildPartitionParameters,
} from "./unstructured-client";

describe("buildPartitionParameters", () => {
  it("sends the whole file, keeps failed pages fatal, and requests stable ids", () => {
    const params = buildPartitionParameters(new ArrayBuffer(0), "a.pdf", false);
    expect(params.strategy).toBe("auto");
    expect(params.splitPdfPage).toBe(false);
    expect(params.splitPdfAllowFailed).toBe(false);
    expect(params.includePageBreaks).toBe(true);
    expect(params.uniqueElementIds).toBe(true);
    expect(UNSTRUCTURED_TIMEOUT_MS).toBe(120_000);
    expect(UNSTRUCTURED_RETRY.backoff.maxElapsedTime).toBe(15_000);
  });

  it("selects hi-res only when the server enables it", () => {
    expect(buildPartitionParameters(new ArrayBuffer(0), "a.pdf", true).strategy).toBe(
      "hi_res",
    );
  });
});
