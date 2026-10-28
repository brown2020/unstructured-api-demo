import { describe, expect, it } from "vitest";
import { safeMailtoHref } from "./safe-mailto";

describe("safeMailtoHref", () => {
  it("allows a plain address", () => {
    expect(safeMailtoHref(" demo@example.com ")).toBe("mailto:demo@example.com");
  });

  it("rejects mailto parameters and non-addresses", () => {
    expect(safeMailtoHref("demo@example.com?bcc=evil@example.com")).toBeNull();
    expect(safeMailtoHref("Name <demo@example.com>")).toBeNull();
    expect(safeMailtoHref("javascript:alert(1)")).toBeNull();
    expect(safeMailtoHref("demo@example.com\r\nBcc: evil@example.com")).toBeNull();
  });
});
