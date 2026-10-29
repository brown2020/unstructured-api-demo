import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { resetParseGuardForTests } from "@/lib/parse-guard";
import { BAD_KEY_MESSAGE, OUT_OF_CREDITS_MESSAGE, UNSUPPORTED_TYPE_MESSAGE } from "@/lib/parse-errors";

const SECRET = "super-secret-key-value";

function setNodeEnv(value: string | undefined) {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

function pdfRequest() {
  const form = new FormData();
  form.append("file", new File(["%PDF-1.4"], "quarterly.pdf", { type: "application/pdf" }));
  return new NextRequest("https://example.com/api/parse", {
    method: "POST",
    headers: {
      origin: "https://example.com",
      host: "example.com",
      "x-forwarded-for": "198.51.100.40",
    },
    body: form,
  });
}

function jsonResponse(status: number, body: unknown, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("POST /api/parse transform errors", () => {
  const prevFixture = process.env.UNSTRUCTURED_USE_FIXTURES;
  const prevKey = process.env.UNSTRUCTURED_API_KEY;
  const prevUrl = process.env.UNSTRUCTURED_API_URL;
  const prevNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    resetParseGuardForTests();
    delete process.env.UNSTRUCTURED_USE_FIXTURES;
    process.env.UNSTRUCTURED_API_KEY = SECRET;
    process.env.UNSTRUCTURED_API_URL = "https://transform.unstructured.io/api/v2";
    setNodeEnv("production");
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    if (prevFixture === undefined) delete process.env.UNSTRUCTURED_USE_FIXTURES;
    else process.env.UNSTRUCTURED_USE_FIXTURES = prevFixture;
    if (prevKey === undefined) delete process.env.UNSTRUCTURED_API_KEY;
    else process.env.UNSTRUCTURED_API_KEY = prevKey;
    if (prevUrl === undefined) delete process.env.UNSTRUCTURED_API_URL;
    else process.env.UNSTRUCTURED_API_URL = prevUrl;
    setNodeEnv(prevNodeEnv);
    vi.unstubAllGlobals();
  });

  async function read(response: Response) {
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain(SECRET);
    return body as {
      ok: boolean;
      message: string | null;
      chunks: Array<{ heading: string | null }> | null;
      demoMessage: string | null;
    };
  }

  it("returns 401 for a bad key and does not show demo results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(401, { code: "unauthorized", message: `bad ${SECRET}` })),
    );
    const response = await POST(pdfRequest());
    const body = await read(response);
    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.message).toBe(BAD_KEY_MESSAGE);
    expect(body.chunks).toBeNull();
    expect(body.demoMessage).toBeNull();
  });

  it("returns demo data after a 402 credit failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(402, { code: "quota_exceeded", message: `out of credits ${SECRET}` }),
      ),
    );
    const response = await POST(pdfRequest());
    const body = await read(response);
    expect(response.status).toBe(402);
    expect(body.message).toBe(OUT_OF_CREDITS_MESSAGE);
    expect(body.demoMessage).toBe(`Demo data. ${OUT_OF_CREDITS_MESSAGE}`);
    expect(body.chunks?.[0]?.heading).toBe("Quarterly Operations Summary");
  });

  it("returns 415 for an unsupported upstream file", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(415, { code: "unsupported_file_type", message: `nope ${SECRET}` }),
      ),
    );
    const response = await POST(pdfRequest());
    const body = await read(response);
    expect(response.status).toBe(415);
    expect(body.message).toBe(UNSUPPORTED_TYPE_MESSAGE);
    expect(body.chunks).toBeNull();
    expect(body.demoMessage).toBeNull();
  });

  it("shows the Demo data badge when the key is missing", async () => {
    delete process.env.UNSTRUCTURED_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(pdfRequest());
    const body = await read(response);
    expect(response.status).toBe(200);
    expect(body.demoMessage).toMatch(/^Demo data/);
    expect(body.chunks?.[0]?.heading).toBe("Quarterly Operations Summary");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
