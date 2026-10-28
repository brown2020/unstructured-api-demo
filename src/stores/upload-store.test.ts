import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/parse", () => ({
  parseFile: vi.fn(),
}));

import { parseFile } from "@/actions/parse";
import type { Chunk } from "@/types";
import { useUploadStore } from "./upload-store";

const chunk: Chunk = {
  heading: "Hi",
  content: [
    {
      type: "NarrativeText",
      element_id: "n1",
      text: "Hello",
      metadata: {
        filetype: "application/pdf",
        languages: ["eng"],
        page_number: 1,
        filename: "a.pdf",
      },
    },
  ],
};

function pdf() {
  return new File(["%PDF"], "a.pdf", { type: "application/pdf" });
}

describe("upload store", () => {
  beforeEach(() => {
    useUploadStore.getState().reset();
    vi.mocked(parseFile).mockReset();
  });

  it("stores a successful parse result", async () => {
    vi.mocked(parseFile).mockResolvedValue({ ok: true, chunks: [chunk] });
    await useUploadStore.getState().uploadDocument(pdf());
    expect(useUploadStore.getState().status).toBe("ready");
    expect(useUploadStore.getState().chunks?.[0].heading).toBe("Hi");
    expect(useUploadStore.getState().parseGeneration).toBeGreaterThan(0);
  });

  it("shows the action message instead of throwing", async () => {
    vi.mocked(parseFile).mockResolvedValue({
      ok: false,
      message: "Too many parse requests. Wait a few minutes and try again.",
    });
    await useUploadStore.getState().uploadDocument(pdf());
    expect(useUploadStore.getState().status).toBe("error");
    expect(useUploadStore.getState().errorMessage).toMatch(/too many/i);
  });

  it("ignores a parse that finishes after reset", async () => {
    let resolveParse: (value: Awaited<ReturnType<typeof parseFile>>) => void = () => {};
    vi.mocked(parseFile).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveParse = resolve;
        }),
    );

    const pending = useUploadStore.getState().uploadDocument(pdf());
    useUploadStore.getState().reset();
    resolveParse({ ok: true, chunks: [chunk] });
    await pending;

    expect(useUploadStore.getState().status).toBe("idle");
    expect(useUploadStore.getState().chunks).toBeNull();
  });
});
