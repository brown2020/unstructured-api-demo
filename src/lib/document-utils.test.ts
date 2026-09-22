import { describe, expect, it } from "vitest";
import {
  organizeElementsIntoChunks,
  processFileUpload,
  validateFileType,
  MAX_FILE_SIZE_BYTES,
} from "./document-utils";
import type { Element } from "@/types";

function el(type: Element["type"], id: string, text?: string): Element {
  return {
    type,
    element_id: id,
    text,
    metadata: {
      filetype: "application/pdf",
      languages: ["eng"],
      page_number: 1,
      filename: "sample.pdf",
    },
  };
}

describe("validateFileType", () => {
  it("accepts pdf and images by mime", () => {
    expect(
      validateFileType(new File([""], "a.pdf", { type: "application/pdf" }))
    ).toBe(true);
    expect(
      validateFileType(new File([""], "a.png", { type: "image/png" }))
    ).toBe(true);
    expect(
      validateFileType(new File([""], "a.jpg", { type: "image/jpeg" }))
    ).toBe(true);
  });

  it("accepts by extension when mime empty", () => {
    expect(validateFileType(new File([""], "scan.PDF", { type: "" }))).toBe(
      true
    );
  });

  it("rejects unsupported types", () => {
    expect(
      validateFileType(new File([""], "a.txt", { type: "text/plain" }))
    ).toBe(false);
  });
});

describe("processFileUpload denial", () => {
  it("rejects missing file", async () => {
    await expect(processFileUpload(new FormData())).rejects.toThrow(/no file/i);
  });

  it("rejects unsupported type", async () => {
    const fd = new FormData();
    fd.append("file", new File(["hi"], "notes.txt", { type: "text/plain" }));
    await expect(processFileUpload(fd)).rejects.toThrow(
      /unsupported|pdf|image/i
    );
  });

  it("rejects oversized file", async () => {
    const fd = new FormData();
    const big = new File([new Uint8Array(MAX_FILE_SIZE_BYTES + 1)], "big.pdf", {
      type: "application/pdf",
    });
    fd.append("file", big);
    await expect(processFileUpload(fd)).rejects.toThrow(/large|10\s*mb/i);
  });

  it("accepts valid pdf", async () => {
    const fd = new FormData();
    fd.append(
      "file",
      new File(["%PDF"], "ok.pdf", { type: "application/pdf" })
    );
    const result = await processFileUpload(fd);
    expect(result.filename).toBe("ok.pdf");
    expect(result.buffer.byteLength).toBeGreaterThan(0);
  });
});

describe("organizeElementsIntoChunks", () => {
  it("promotes Title to heading and groups following content", () => {
    const chunks = organizeElementsIntoChunks([
      el("Title", "t1", "Intro"),
      el("NarrativeText", "n1", "Hello"),
      el("NarrativeText", "n2", "World"),
      el("Title", "t2", "Next"),
      el("EmailAddress", "e1", "a@b.com"),
    ]);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].heading).toBe("Intro");
    expect(chunks[0].content.map((c) => c.element_id)).toEqual(["n1", "n2"]);
    expect(chunks[1].heading).toBe("Next");
    expect(chunks[1].content[0].element_id).toBe("e1");
  });

  it("resets heading on PageBreak", () => {
    const chunks = organizeElementsIntoChunks([
      el("Title", "t1", "A"),
      el("NarrativeText", "n1", "x"),
      el("PageBreak", "pb1"),
      el("NarrativeText", "n2", "y"),
    ]);
    expect(chunks[0].heading).toBe("A");
    expect(chunks[1].heading).toBeNull();
    expect(chunks[1].content[0].element_id).toBe("n2");
  });
});
