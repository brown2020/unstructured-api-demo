import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/parse-client", () => ({
  postParse: vi.fn(),
}));

import { postParse } from "@/lib/parse-client";
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
    vi.mocked(postParse).mockReset();
  });

  it("stores a successful parse result", async () => {
    vi.mocked(postParse).mockResolvedValue({
      ok: true,
      chunks: [chunk],
      demoMessage: null,
      status: 200,
    });
    await useUploadStore.getState().uploadDocument(pdf());
    expect(useUploadStore.getState().status).toBe("ready");
    expect(useUploadStore.getState().chunks?.[0].heading).toBe("Hi");
    expect(useUploadStore.getState().parseGeneration).toBeGreaterThan(0);
  });

  it("shows the demo banner with sample chunks", async () => {
    vi.mocked(postParse).mockResolvedValue({
      ok: true,
      chunks: [chunk],
      demoMessage: "Demo mode: sample results. The parsing service is not configured.",
      status: 200,
    });
    await useUploadStore.getState().uploadDocument(pdf());
    expect(useUploadStore.getState().status).toBe("ready");
    expect(useUploadStore.getState().demoMessage).toMatch(/^Demo mode: sample results/);
    expect(useUploadStore.getState().errorMessage).toBeNull();
  });

  it("shows the action message instead of throwing", async () => {
    vi.mocked(postParse).mockResolvedValue({
      ok: false,
      message: "Too many parse requests. Wait a few minutes and try again.",
      status: 429,
    });
    await useUploadStore.getState().uploadDocument(pdf());
    expect(useUploadStore.getState().status).toBe("error");
    expect(useUploadStore.getState().errorMessage).toMatch(/too many/i);
  });

  it("ignores a parse that finishes after reset", async () => {
    let resolveParse: (value: Awaited<ReturnType<typeof postParse>>) => void = () => {};
    vi.mocked(postParse).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveParse = resolve;
        }),
    );

    const pending = useUploadStore.getState().uploadDocument(pdf());
    useUploadStore.getState().reset();
    resolveParse({ ok: true, chunks: [chunk], demoMessage: null, status: 200 });
    await pending;

    expect(useUploadStore.getState().status).toBe("idle");
    expect(useUploadStore.getState().chunks).toBeNull();
  });
});
