import { describe, expect, it } from "vitest";
import { normalizeUnstructuredServerURL, sdkPartitionURL } from "./unstructured-url";

const EXPECTED = "https://api.unstructuredapp.io/general/v0/general";

describe("normalizeUnstructuredServerURL", () => {
  it("keeps a single partition path for a host or a full endpoint", () => {
    const inputs = [
      "https://api.unstructuredapp.io",
      "https://api.unstructuredapp.io/",
      "https://api.unstructuredapp.io/general/v0/general",
      "https://api.unstructuredapp.io/general/v0/general/",
      "https://api.unstructuredapp.io/general/v0/general/general/v0/general",
    ];

    for (const input of inputs) {
      const serverURL = normalizeUnstructuredServerURL(input);
      expect(sdkPartitionURL(serverURL)).toBe(EXPECTED);
      expect(sdkPartitionURL(serverURL)).not.toContain("/general/v0/general/general");
    }
  });

  it("accepts the older unstructured.io host the same way", () => {
    const serverURL = normalizeUnstructuredServerURL(
      "https://api.unstructured.io/general/v0/general",
    );
    expect(sdkPartitionURL(serverURL)).toBe(
      "https://api.unstructured.io/general/v0/general",
    );
  });

  it("drops query strings so a key in the URL is not kept", () => {
    const serverURL = normalizeUnstructuredServerURL(
      "https://api.unstructuredapp.io/general/v0/general?api_key=super-secret-key-value",
    );
    expect(serverURL).toBe("https://api.unstructuredapp.io");
    expect(serverURL).not.toContain("super-secret-key-value");
  });

  it("rejects a value that is not an http(s) URL", () => {
    expect(() => normalizeUnstructuredServerURL("not a url")).toThrow(/invalid/i);
    expect(() => normalizeUnstructuredServerURL("ftp://files.example/general/v0/general")).toThrow(
      /invalid/i,
    );
  });
});
