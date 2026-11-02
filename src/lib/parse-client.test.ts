import { beforeEach, describe, expect, it, vi } from "vitest";
import { RATE_LIMIT_MESSAGE, UNAVAILABLE_MESSAGE } from "@/lib/parse-errors";
import { postParse } from "@/lib/parse-client";
import { useUploadStore } from "@/stores/upload-store";
import type { Chunk } from "@/types";

const chunk: Chunk = {
  heading: "Notes",
  content: [
    {
      type: "NarrativeText",
      element_id: "n1",
      text: "Quarterly update",
      metadata: {
        filetype: "application/pdf",
        languages: ["eng"],
        page_number: 1,
        filename: "notes.pdf",
      },
    },
  ],
};

function pdf() {
  return new File(["%PDF-1.4"], "notes.pdf", { type: "application/pdf" });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("postParse", () => {
  beforeEach(() => {
    useUploadStore.getState().reset();
    vi.unstubAllGlobals();
  });

  it("posts the file to /api/parse and returns chunks", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe("/api/parse");
      expect(init?.method).toBe("POST");
      expect(init?.body).toBeInstanceOf(FormData);
      const file = (init?.body as FormData).get("file");
      expect(file).toBeInstanceOf(File);
      expect((file as File).name).toBe("notes.pdf");
      return jsonResponse({ ok: true, chunks: [chunk], demoMessage: null });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(postParse(pdf())).resolves.toEqual({
      ok: true,
      chunks: [chunk],
      demoMessage: null,
      status: 200,
    });
  });

  it("keeps a demo banner and stores it through the upload flow", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          ok: true,
          chunks: [chunk],
          demoMessage: "Demo data. The parsing service is not configured.",
        }),
      ),
    );

    await useUploadStore.getState().uploadDocument(pdf());

    expect(useUploadStore.getState().status).toBe("ready");
    expect(useUploadStore.getState().chunks?.[0].heading).toBe("Notes");
    expect(useUploadStore.getState().demoMessage).toBe(
      "Demo data. The parsing service is not configured.",
    );
  });

  it("hides leaked secrets and non-demo banners", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          {
            ok: false,
            message: "rejected api_key=super-secret",
            demoMessage: "Sample output, not a demo banner",
          },
          401,
        ),
      ),
    );

    await expect(postParse(pdf())).resolves.toEqual({
      ok: false,
      message: UNAVAILABLE_MESSAGE,
      status: 401,
    });
  });

  it("uses the rate-limit copy when a 429 body has no message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ ok: false }, 429)));

    await expect(postParse(pdf())).resolves.toEqual({
      ok: false,
      message: RATE_LIMIT_MESSAGE,
      status: 429,
    });
  });

  it("reports the service unavailable when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    await expect(postParse(pdf())).resolves.toEqual({
      ok: false,
      message: UNAVAILABLE_MESSAGE,
      status: 0,
    });
  });

  it("reports the service unavailable when the body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 502 })),
    );

    await expect(postParse(pdf())).resolves.toEqual({
      ok: false,
      message: UNAVAILABLE_MESSAGE,
      status: 502,
    });
  });

  it("clears a previous result when the parse response has no chunks", async () => {
    useUploadStore.setState({
      chunks: [chunk],
      status: "ready",
      errorMessage: null,
      demoMessage: null,
      showRawJson: false,
      parseGeneration: 1,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ ok: true, chunks: [], message: "No readable content found." })),
    );

    await useUploadStore.getState().uploadDocument(pdf());

    expect(useUploadStore.getState().status).toBe("error");
    expect(useUploadStore.getState().chunks).toBeNull();
    expect(useUploadStore.getState().errorMessage).toBe("No readable content found.");
  });
});
